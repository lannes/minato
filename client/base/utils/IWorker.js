class IWorker {
    static async createProxy(clazz, name, worker) {
        return new (IWorker.Proxy(clazz))(worker, name);
    }

    static async startWorkerForProxy(clazz, name, workerScript) {
        if (!IWorker._workersSupported) {
            await IWorker._workerImplementation[clazz.name].init(name);
            return IWorker._workerImplementation[clazz.name];
        } else {
            Minato._path = '';
            if (Minato._currentScript.src.indexOf('/') !== -1) {
                Minato._path = Minato._currentScript.src.substring(0, Minato._currentScript.src.lastIndexOf('/') + 1);
            } else {
                Minato._path = './';
            }

            if (!workerScript)
                workerScript = `${Minato._path}worker.js`;

            const scriptContent = `importScripts('${workerScript}');`;
            const blob = new Blob([scriptContent], { type: 'text/javascript' });
            const url = window.URL.createObjectURL(blob);
            const worker = new Worker(url);
            return IWorker.createProxy(clazz, name, worker);
        }
    }

    static async startWorkerPoolForProxy(clazz, name, size, workerScript) {
        return (new (IWorker.Pool(clazz))((name) => IWorker.startWorkerForProxy(clazz, name, workerScript), name, size)).start();
    }

    static async stubBaseOnMessage(msg) {
        try {
            if (msg.data.command === 'init') {
                if (IWorker._workerImplementation[msg.data.args[0]]) {
                    const res = await IWorker._workerImplementation[msg.data.args[0]].init(msg.data.args[1]);
                    self.postMessage({ status: 'OK', result: res, id: msg.data.id });
                } else {
                    self.postMessage({ status: 'error', result: 'Unknown worker!', id: msg.data.id });
                }
            } else {
                self.postMessage({ status: 'error', result: 'Worker not yet initialized!', id: msg.data.id });
            }
        } catch (e) {
            self.postMessage({ status: 'error', result: e, id: msg.data.id });
        }
    }

    static get _workersSupported() {
        return typeof Worker !== 'undefined';
    }

    static get _insideWebWorker() {
        return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    }

    static prepareForWorkerUse(baseClazz, impl) {
        if (IWorker._insideWebWorker) {
            self.onmessage = IWorker.stubBaseOnMessage;
        }

        IWorker._workerImplementation = IWorker._workerImplementation || {};
        IWorker._workerImplementation[baseClazz.name] = impl;
    }

    static Proxy(clazz) {
        const proxyClass = class extends clazz {
            constructor(worker, name) {
                super();
                this._name = name;
                this._messageId = 0;
                this._worker = worker;
                this._worker.onmessage = this._receive.bind(this);
                this._waiting = new Map();
                return this._invoke('init', [clazz.name, name]).then(() => { return this; });
            }

            _receive(msg) {
                const cb = this._waiting.get(msg.data.id);
                if (!cb) {
                    console.log(`WorkerProxy: Unknown reply ${msg}`);
                } else {
                    this._waiting.delete(msg.data.id);
                    if (msg.data.status === 'OK') {
                        cb.resolve(msg.data.result);
                    } else if (msg.data.status === 'error') {
                        cb.error(msg.data.result);
                    }
                }
            }

            _invoke(command, args = []) {
                return new Promise((resolve, error) => {
                    const obj = { command: command, args: args, id: this._messageId++ };
                    this._waiting.set(obj.id, { resolve, error });
                    this._worker.postMessage(obj);
                });
            }

            destroy() {
                return this._invoke('destroy');
            }
        };

        for (const funcName of Object.getOwnPropertyNames(clazz.prototype)) {
            if (typeof clazz.prototype[funcName] === 'function' && funcName !== 'constructor') {
                proxyClass.prototype[funcName] = function (...args) {
                    return this._invoke(funcName, args);
                };
            }
        }

        return proxyClass;
    }

    static Stub(clazz) {
        const Stub = class extends clazz {
            constructor() {
                super();
            }

            _result(msg, status, result) {
                self.postMessage({ status, result, id: msg.data.id });
            }

            _onmessage(msg) {
                try {
                    const res = this._invoke(msg.data.command, msg.data.args);
                    if (res instanceof Promise) {
                        res.then((finalRes) => { this._result(msg, 'OK', finalRes); });
                    } else {
                        this._result(msg, 'OK', res);
                    }
                } catch (e) {
                    this._result(msg, 'error', e.message || e);
                }
            }

            init(name) {
                this._name = name;
                if (IWorker._insideWebWorker) {
                    self.name = name;
                    self.onmessage = (msg) => this._onmessage(msg);
                }
            }

            _invoke(command, args) {
                return this[command].apply(this, args);
            }

            destroy() {
                if (IWorker._insideWebWorker) {
                    self.close();
                }
            }
        };

        for (const funcName of Object.getOwnPropertyNames(clazz.prototype)) {
            if (typeof clazz.prototype[funcName] === 'function' && funcName !== 'constructor') {
                Stub.prototype[funcName] = function () {
                    throw `Not implemented in IWorker Stub: ${funcName}`;
                };
            }
        }

        return Stub;
    }

    static Pool(clazz) {
        const poolClass = class extends clazz {
            constructor(proxyInitializer, name = 'pool', size = 1) {
                super();
                this._proxyInitializer = proxyInitializer;
                this._name = name;
                this._poolSize = size;
                this._workers = [];
                this._freeWorkers = [];
                this._waitingCalls = [];
            }

            async start() {
                await this._updateToSize();

                return this;
            }

            get poolSize() {
                return this._poolSize;
            }

            set poolSize(_size) {
                this._poolSize = _size;
                this._updateToSize().catch(e => console.log(`IWorker ${e}`));
            }

            destroy() {
                this._poolSize = 0;
                return this._updateToSize();
            }

            _invoke(name, args) {
                if (IWorker._workersSupported) {
                    return new Promise((resolve, error) => {
                        this._waitingCalls.push({ name, args, resolve, error });
                        const worker = this._freeWorkers.shift();
                        if (worker) {
                            this._step(worker).catch(e => console.log(`IWorker ${e}`));
                        }
                    });
                } else {
                    return this._workers[0][name].apply(this._workers[0], args);
                }
            }

            async _step(worker) {
                let call = this._waitingCalls.shift();
                while (call) {
                    try {
                        call.resolve(await worker[call.name].apply(worker, call.args));
                    } catch (e) {
                        call.error(e);
                    }
                    if (this._workers.indexOf(worker) === -1) {
                        worker.destroy();
                        return;
                    }
                    call = this._waitingCalls.shift();
                }

                this._freeWorkers.push(worker);
            }

            async _updateToSize() {
                if (typeof Worker === 'undefined' && this._poolSize > 1) {
                    Log.d(IWorker, 'Pool of size larger than 1 requires WebWorker support.');
                    this._poolSize = 1;
                }

                const workerPromises = [];
                while (this._workers.length + workerPromises.length < this._poolSize) {
                    workerPromises.push(this._proxyInitializer(`${this._name}#${this._workers.length + workerPromises.length}`));
                }
                const createdWorkers = await Promise.all(workerPromises);
                for (const worker of createdWorkers) {
                    this._workers.push(worker);
                    this._step(worker).catch(e => console.log(`IWorker ${e}`));
                }

                while (this._workers.length > this._poolSize) {
                    const worker = this._freeWorkers.shift() || this._workers.pop();
                    const idx = this._workers.indexOf(worker);
                    if (idx >= 0) {
                        this._workers.splice(idx, 1);
                        worker.destroy();
                    }
                }

                return this;
            }
        };

        for (const funcName of Object.getOwnPropertyNames(clazz.prototype)) {
            if (typeof clazz.prototype[funcName] === 'function' && funcName !== 'constructor') {
                poolClass.prototype[funcName] = function (...args) {
                    return this._invoke(funcName, args);
                };
            }
        }

        return poolClass;
    }
}

IWorker._workerImplementation = {};




class Synchronizer {
    constructor() {
        this._queue = [];

        this._working = false;
    }

    push(fn) {
        return new Promise((resolve, reject) => {
            this._queue.push({ fn: fn, resolve: resolve, reject: reject });
            if (!this._working) {
                this._doWork();//.catch(e => console.log(e));
            }
        });
    }

    async _doWork() {
        this._working = true;

        while (this._queue.length > 0) {
            const job = this._queue.shift();

            try {
                const result = /* await */ job.fn();
                job.resolve(result);
            } catch (e) {
                if (job.reject)
                    job.reject(e);
            }
        }

        this._working = false;
    }

    clear() {
        for (const job of this._queue) {
            if (job.reject)
                job.reject();
        }

        this._queue = [];
    }

    get working() {
        return this._working;
    }
}

if (typeof module !== 'undefined')
    module.exports = Synchronizer;

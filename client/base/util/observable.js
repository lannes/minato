class Observable {
    constructor() {
        this._listeners = new Map();
    }

    on(type, callback) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, [callback]);
            return 0;
        } else {
            return this._listeners.get(type).push(callback) - 1;
        }
    }

    off(type, id) {
        if (!this._listeners.has(type) || !this._listeners.get(type)[id])
            return;
        delete this._listeners.get(type)[id];
    }

    notify(type, ...args) {
        const promises = [];

        if (this._listeners.has(type)) {
            for (const id in this._listeners.get(type)) {
                const listener = this._listeners.get(type)[id];
                const result = listener.apply(null, args);
                if (result instanceof Promise)
                    promises.push(result);
            }
        }

        if (promises.length > 0)
            return Promise.all(promises);

        return null;
    }
}

if (typeof module !== 'undefined')
    module.exports = Observable;
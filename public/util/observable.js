class Observable {
    constructor() {
        this.listeners = new Map();
    }

    on(type, observer) {
        if (this.listeners.has(type)) {
            return this.listeners.get(type).push(observer);
        }

        this.listeners.set(type, [observer]);
        return 1;
    }

    off(type, id) {
        if (!this.listeners.has(type) || !this.listeners.get(type)[id])
            return;
        delete this.listeners.get(type)[id];
    }

    notify(type, message) {
        if (this.listeners.has(type)) {
            for (const id in this.listeners.get(type)) {
                const listener = this.listeners.get(type)[id];
                listener(message);
            }
        }
    }
} 
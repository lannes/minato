class SchedulerAsync {
    constructor() {
        this.queue = [];
    }

    addJob(task) {
        return this.queue.push(task);
    }

    removeJob(id) {
        this.queue.splice(id, 1);
    }

    _await(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async start() {
        if (this.queue.length > 0) {
            const task = this.queue.shift();
            await task();
        }

        await this._await(50);
        await this.start();
    }
}

if (typeof module !== 'undefined')
    module.exports = SchedulerAsync;

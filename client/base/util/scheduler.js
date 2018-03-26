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

    start() {
        if (this.queue.length > 0) {
            const task = this.queue.shift();
            task();
        }

        let self = this;
        setTimeout(() => {
            self.start();
        }, 50)
    }
}

if (typeof module !== 'undefined')
    module.exports = SchedulerAsync;

importScripts(
    '../crypto/sjcl.js?v=0.1',
    '../crypto/hash.js?v=0.1',
    '../../base/util/buffer.js?v=0.1',
    '../../base/util/common.js?v=0.1',
    '../../base/util/observable.js?v=0.2',
    '../../base/core/miner/miner.js?v=0.2',
);

class KMinerWorker {
    constructor() {
        this.minerPort = null;
        this.miner = new Miner();

        this.miner.on('hashrate', (hashrate) => this._send({
            'cmd': 'hashrate', 'msg': hashrate
        }));

        this.miner.on('block', (block) => this._send({
            'cmd': 'block', 'msg': block
        }));

        this.miner.on('state', (state) => this._send({ 'cmd': '' }));
    }

    _send(message) {
        this.minerPort.postMessage(message);
    }

    _onMessageFromNode(event) {
        const data = event.data;
        switch (data['cmd']) {
            case 'mine': {
                let block = data['msg'];
                this.miner.start(block);
            }
                break;
            case 'pause':
                this.miner.stop();
                break;
        }
    }

    onmessage(event) {
        const data = event.data;
        switch (data['cmd']) {
            case 'connect':
                this.minerPort = event.ports[0];
                this.minerPort.onmessage = this._onMessageFromNode.bind(this);
                break;
            default:
                break;
        }
    }
}

const minerWorker = new KMinerWorker();
self.onmessage = (event) => {
    minerWorker.onmessage(event);
};

self.onerror = (e) => {
    console.log(e.message + ' (' + e.filename + ':' + e.lineno + ')');
};

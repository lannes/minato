if (typeof require !== 'undefined') {
    global.Observable = require('../../utils/Observable');
    global.MinerWorkerImpl = require('./MinerWorkerImpl');
}

class MinerWorker extends MinerWorkerImpl {
    constructor() {
        super();

        this._observable = new Observable();

        this._miningEnabled = false;
        this._activeNonces = [];
        this._noncesPerRun = 256;
        this._cycleWait = 100;
    }

    on(type, callback) {
        this._observable.on(type, callback);
    }

    off(type, id) {
        this._observable.off(type, id);
    }

    startMiningOnBlock(block, difficult) {
        this._block = block;
        this._difficult = difficult;

        this._activeNonces = [];
        this._miningEnabled = true;

        this._startMiner();
    }

    get noncesPerRun() {
        return this._noncesPerRun;
    }

    set noncesPerRun(nonces) {
        this._noncesPerRun = nonces;
    }

    get working() {
        return this._miningEnabled;
    }

    stop() {
        this._miningEnabled = false;
    }

    _startMiner() {
        const minNonce = this._activeNonces.length === 0 ? 0 : Math.max.apply(null, this._activeNonces.map((a) => a.maxNonce));
        const maxNonce = minNonce + this._noncesPerRun;
        const nonceRange = { minNonce, maxNonce };
        this._activeNonces.push(nonceRange);

        this._mineBlock(nonceRange);
    }

    async _mineBlock(nonceRange) {
        const block = this._block;
        let blockHeader = new KBuffer(block.header.serialize());

        if (this._miningEnabled) {
            let result = await this.mine(blockHeader, this._difficult, nonceRange.minNonce, nonceRange.maxNonce);
            if (result) {
                this._observable.notify('share', { block: block, nonce: result.nonce, hash: result.hash });
                return;
            } else {
                this._observable.notify('no-share', { nonce: nonceRange.maxNonce });
            }

            const newMin = Math.max.apply(null, this._activeNonces.map((a) => a.maxNonce));
            const newRange = { minNonce: newMin, maxNonce: newMin + this._noncesPerRun };
            this._activeNonces.splice(this._activeNonces.indexOf(nonceRange), 1, newRange);
            nonceRange = newRange;
        }

        if (this._miningEnabled) {
            setTimeout(() => this._mineBlock(nonceRange), this._cycleWait);
        }
    }
}

if (typeof module !== 'undefined')
    module.exports = MinerWorker;

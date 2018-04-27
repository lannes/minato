class MinerWorkerPool extends IWorker.Pool(MinerWorker) {
    constructor(size = 1) {
        super((name) => IWorker.startWorkerForProxy(MinerWorker, name), 'miner', size);

        this._miningEnabled = false;
        this._activeNonces = [];
        this._noncesPerRun = 256;

        this._observable = new Observable();

        this._runsPerCycle = Infinity;
        this._cycleWait = 100;

        this._superUpdateToSize = super._updateToSize;
    }

    on(type, callback) {
        this._observable.on(type, callback);
    }

    off(type, id) {
        this._observable.off(type, id);
    }

    async startMiningOnBlock(block, difficult) {
        this._block = block;
        this._difficult = difficult;

        if (!this._miningEnabled) {            
            await this._updateToSize();
            this._activeNonces = [];
            this._miningEnabled = true;
            for (let i = 0; i < this.poolSize; ++i) {
                this._startMiner();
            }
        } else {
            this._activeNonces = [{ minNonce: 0, maxNonce: 0 }];
        }
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

    async _updateToSize() {
        if (!PlatformUtils.isNodeJs()) {
            await this._superUpdateToSize.call(this);
        }

        while (this._miningEnabled && this._activeNonces.length < this.poolSize) {
            this._startMiner();
        }
    }

    _startMiner() {
        if (this._activeNonces.length >= this.poolSize) {
            return;
        }

        const minNonce = this._activeNonces.length === 0 ? 0 : Math.max.apply(null, this._activeNonces.map((a) => a.maxNonce));
        const maxNonce = minNonce + this._noncesPerRun;
        const nonceRange = { minNonce, maxNonce };
        this._activeNonces.push(nonceRange);

        this._singleMiner(nonceRange);
    }

    async _singleMiner(nonceRange) {
        let i = 0;
        while (this._miningEnabled && (IWorker.areWorkersAsync || i === 0) && i < this._runsPerCycle) {
            i++;
            const block = this._block;

            const result = await this.multiMine(block.header.serialize(), this._difficult, nonceRange.minNonce, nonceRange.maxNonce);
            if (result) {
                this._observable.notify('share', { block: block, nonce: result.nonce, hash: result.hash });
            } else {
                this._observable.notify('no-share', { nonce: nonceRange.maxNonce });
            }

            if (this._activeNonces.length > this.poolSize) {
                this._activeNonces.splice(this._activeNonces.indexOf(nonceRange), 1);
                return;
            } else {
                const newMin = Math.max.apply(null, this._activeNonces.map((a) => a.maxNonce));
                const newRange = { minNonce: newMin, maxNonce: newMin + this._noncesPerRun };
                this._activeNonces.splice(this._activeNonces.indexOf(nonceRange), 1, newRange);
                nonceRange = newRange;
            }
        }

        if (this._miningEnabled) {
            setTimeout(() => this._singleMiner(nonceRange), this._cycleWait);
        }
    }
}
class Miner extends Observable {
    constructor() {
        super();

        this.rounds = 256;
        this.wait = 100;
        this.enabled = false;

        this.hashCount = 0;
        this.hashrate = 0;

        this.init();
    }

    init() {
        this.lastHashrate = Date.now();
        this.hashrateId = setInterval(() => this._updateHashrate(), 1000);
    }

    start(block) {
        if (this.enabled)
            return;

        this.enabled = true;

        this.block = block;

        this._mineBlock(0);
    }

    stop() {
        this.enabled = false;
    }

    _updateHashrate() {
        const elapsed = (Date.now() - this.lastHashrate) / 1000;

        this.hashrate = Math.round(this.hashCount / elapsed);
        this.notify('hashrate', this.hashrate);

        this.lastHashrate = Date.now();
        this.hashCount = 0;
    }

    _isProofOfWork(hash, difficulty) {
        const hashInBinary = hexToBinary(hash);
        const requiredPrefix = '0'.repeat(difficulty);
        return hashInBinary.startsWith(requiredPrefix);
    }

    _mineBlock(startNonce) {
        let nonce = startNonce;

        while (this.enabled) {
            const hash = KHash.sha256(
                this.block['index'] +
                this.block['previousHash'] +
                this.block['timestamp'] +
                this.block['data'] +
                this.block['difficulty'] +
                nonce
            );

            this.hashCount++;

            if (this._isProofOfWork(hash, this.block['difficulty'])) {
                this.block['hash'] = hash;
                this.block['nonce'] = nonce;
                break;
            }

            if (nonce < startNonce + this.rounds)
                nonce++;
            else
                break;
        }

        if (this.enabled) {
            if (this.block['nonce'] !== 0) {
                this.enabled = false;

                this.notify('block', this.block);
            } else {
                startNonce += this.rounds;

                let self = this;
                setTimeout(() => {
                    self._mineBlock(startNonce);
                }, this.wait);
            }
        }
    }
}


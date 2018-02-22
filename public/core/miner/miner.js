class Miner extends Observable {
    constructor() {
        super();

        this.rounds = 256;
        this.wait = 100;
        this.enabled = false;
        this.lastHashrate = 0;
    }

    _hashMatchesDifficulty(hash, difficulty) {
        const hashInBinary = hexToBinary(hash);
        const requiredPrefix = '0'.repeat(difficulty);
        return hashInBinary.startsWith(requiredPrefix);
    }

    async start(block) {
        this.block = block;
        if (!this.enabled) {
            this.enabled = true;
        } else {
        }

        this.hashCount = 0;
        this.hashrate = 0;
        this.totalElapsed = 0;
        this.totalHashCount = 0;

        this.lastHashrate = Date.now();
        this.hashrateId = setInterval(() => this._updateHashrate(), 1000);

        await this._mineBlock(0);
    }

    stop() {
        this.enabled = false;
    }

    _updateHashrate() {
        const elapsed = (Date.now() - this.lastHashrate) / 1000;
        const hashCount = this.hashCount;

        this.hashCount = 0;
        this.lastHashrate = Date.now();

        this.totalElapsed += elapsed;
        this.totalHashCount += hashCount;

        this.hashrate = Math.round(this.totalHashCount / this.totalElapsed);
        this.notify('hashrate', this.hashrate);
    }

    async _mineBlock(startNonce) {
        let nonce = startNonce;

        while (this.enabled) {
            const hash = await sha256(
                this.block['index'] +
                this.block['previousHash'] +
                this.block['timestamp'] +
                this.block['data'] +
                this.block['difficulty'] +
                nonce
            );

            if (this._hashMatchesDifficulty(hash, this.block['difficulty'])) {
                this.block['hash'] = hash;
                this.block['nonce'] = nonce;
                break;
            }

            if (nonce < startNonce + this.rounds)
                nonce++;
            else
                break;
        }

        this.hashCount += this.rounds;

        if (this.enabled) {
            if (this.block['nonce'] !== 0) {
                this.notify('newblock', this.block);
            } else {
                startNonce += this.rounds;
                setTimeout(async () => await this._mineBlock(startNonce), this.wait);
            }
        }
    }
}



if (typeof require !== 'undefined') {
    global.Observable = require('../../util/Observable');
    global.MinerWorker = require('./MinerWorker');
}

class Miner extends Observable {
    constructor(blockchain, pool, uTxOPool) {
        super();

        this._blockchain = blockchain;
        this._mempool = pool;
        this._uTxOPool = uTxOPool;

        this._hashCount = 0;
        this._hashrate = 0;
        this._lastHashrate = 0;
        this._hashrateWorker = null;

        this._lastHashCounts = [];
        this._totalHashCount = 0;
        this._lastElapsed = [];

        this._mempoolChanged = false;

        this._restarting = false;
        this._lastRestart = 0;

        this._submittingBlock = false;

        this._worker = new MinerWorker();
        this._worker.on('share', (obj) => this._onWorkerShare(obj));
        this._worker.on('no-share', (obj) => this._onWorkerShare(obj));

        this._blockchain.on('push-block', (obj) => {
            this._startWork();
        });

        this._mempool.on('transaction-added', () => this._mempoolChanged = true);
    }

    get working() {
        return this._hashrateWorker;
    }

    get hashrate() {
        return this._hashrate;
    }

    async _onWorkerShare(obj) {
        this._hashCount += this._worker.noncesPerRun;
        if (obj.block && obj.block.prevHash.equals(this._blockchain.headHash)) {
            if (BlockUtils.isProofOfWork(obj.hash, obj.block.difficulty) && !this._submittingBlock) {
                obj.block.header.nonce = obj.nonce;

                if (obj.block.header.verifyProofOfWork()) {
                    this._submittingBlock = true;

                    const unspentTxOuts = await this._blockchain.pushBlock(obj.block, this._uTxOPool.transactions);
                    if (unspentTxOuts !== null) {
                        this._submittingBlock = false;
                        this._startWork();
                    } else {
                        this._submittingBlock = false;
                    }
                }
            }
        }

        if (this._mempoolChanged && this._lastRestart + Miner.MIN_TIME_ON_BLOCK < Date.now()) {
            this._startWork();
        }
    }

    _getNextHeader(body) {
        const height = this._blockchain.height + 1;
        const prevHash = this._blockchain.headHash;
        const bodyHash = body.hash();
        const timestamp = Math.round(new Date().getTime() / 1000);
        const difficulty = this._blockchain.difficulty;
        const nonce = 0;

        return new BlockHeader(height, prevHash, bodyHash, timestamp, difficulty, nonce);
    }

    _getNextBody() {
        const address = Wallet.address;

        const rewardTx = Transaction.createReward(address, this._blockchain.height + 1);
        
        if (this._mempool.transactions.length > 0) {

        }

        const transactions = [rewardTx].concat(this._mempool.transactions);

        return new BlockBody(transactions);
    }

    _getNextBlock() {
        const body = this._getNextBody();
        const header = this._getNextHeader(body);

        return new Block(header, body);
    }

    _updateHashrate() {
        const elapsed = (Date.now() - this._lastHashrate) / 1000;
        const hashCount = this._hashCount;

        this._hashCount = 0;
        this._lastHashrate = Date.now();

        this._lastElapsed.push(elapsed);
        this._lastHashCounts.push(hashCount);
        this._totalElapsed += elapsed;
        this._totalHashCount += hashCount;

        if (this._lastElapsed.length > Miner.MOVING_AVERAGE_MAX_SIZE) {
            const oldestElapsed = this._lastElapsed.shift();
            const oldestHashCount = this._lastHashCounts.shift();
            this._totalElapsed -= oldestElapsed;
            this._totalHashCount -= oldestHashCount;
        }

        this._hashrate = Math.round(this._totalHashCount / this._totalElapsed);

        this.notify('hashrate', this._hashrate);
    }

    startWork() {
        if (this.working) {
            return;
        }

        this._lastRestart = Date.now();

        this._hashCount = 0;
        this._lastHashCounts = [];
        this._totalHashCount = 0;
        this._lastElapsed = [];
        this._totalElapsed = 0;
        this._lastHashrate = Date.now();

        this._hashrateWorker = setInterval(() => this._updateHashrate(), 1000);

        this.notify('start', this);
        this._startWork();
    }

    _startWork() {
        if (!this.working || this._restarting) {
            return;
        }

        this._restarting = true;
        this._lastRestart = Date.now();
        this._mempoolChanged = false;

        const block = this._getNextBlock();
        this._worker.startMiningOnBlock(block, block.difficulty);

        this._restarting = false;
    }

    stopWork() {
        if (!this.working) {
            return;
        }

        clearInterval(this._hashrateWorker);
        this._hashrateWorker = null;
        this._hashrate = 0;

        this._hashCount = 0;
        this._lastHashCounts = [];
        this._totalHashCount = 0;
        this._lastElapsed = [];
        this._totalElapsed = 0;

        this._worker.stop();
        this.notify('stop', this);
    }
}

Miner.MIN_TIME_ON_BLOCK = 10000;
Miner.MOVING_AVERAGE_MAX_SIZE = 10;

if (typeof module !== 'undefined')
    module.exports = Miner;


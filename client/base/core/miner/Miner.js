
if (typeof require !== 'undefined') {
    global.Observable = require('../../util/Observable');
    global.MinerWorker = require('./MinerWorker');
}

class Miner extends Observable {
    constructor(blockchain, pool, uTxOPool) {
        super();

        this._blockchain = blockchain;
        this._pool = pool;
        this._uTxOPool = uTxOPool;

        this._hashCount = 0;
        this._hashrate = 0;
        this._lastHashrate = 0;
        this._hashrateWorker = null;

        this._submittingBlock = false;

        this._worker = new MinerWorker();
        this._worker.on('share', (obj) => this._onWorkerShare(obj));
        this._worker.on('no-share', (obj) => this._onWorkerShare(obj));
    }

    get working() {
        return this._hashrateWorker;
    }

    get hashrate() {
        return this._hashrate;
    }

    async _onWorkerShare(obj) {
        this._hashCount += this._worker.noncesPerRun;
        if (obj.block && ArrayUtils.equals(obj.block.prevHash, this._blockchain.headHash)) {
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
    }

    _getNextHeader(body) {
        const height = this._blockchain.height + 1;
        const prevHash = this._blockchain.headHash;
        const bodyHash = body.hash();
        const timestamp = getCurrentTimestamp();
        const difficulty = this._blockchain.difficulty;
        const nonce = 0;

        return new BlockHeader(height, prevHash, bodyHash, timestamp, difficulty, nonce);
    }

    _getNextBody() {
        const address = Wallet.getPublicFromWallet();

        const rewardTx = Transaction.createReward(address, this._blockchain.height + 1);
        const transactions = [rewardTx].concat(this._pool.transactions);

        return new BlockBody(transactions);
    }

    _getNextBlock() {
        const body = this._getNextBody();
        const header = this._getNextHeader(body);

        return new Block(header, body);
    }

    _updateHashrate() {
        const elapsed = (Date.now() - this._lastHashrate) / 1000;

        this._hashrate = Math.round(this._hashCount / elapsed);
        this.notify('hashrate', this._hashrate);

        this._lastHashrate = Date.now();
        this._hashCount = 0;
    }

    startWork() {
        if (this.working) {
            return;
        }

        this._hashCount = 0;

        this._lastHashrate = Date.now();
        this._hashrateWorker = setInterval(() => this._updateHashrate(), 1000);

        this.notify('start', this);
        this._startWork();
    }

    _startWork() {
        //if (this.working) {
        //    return;
        //}

        const block = this._getNextBlock();
        this._worker.startMiningOnBlock(block, block.difficulty);
    }

    stopWork() {
        if (!this.working) {
            return;
        }

        clearInterval(this._hashrateWorker);
        this._hashrateWorker = null;
        this._hashrate = 0;
        this._totalHashCount = 0;

        this.notify('stop', this);
    }
}

if (typeof module !== 'undefined')
    module.exports = Miner;


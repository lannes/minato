class BaseConsensus extends Observable {
    constructor(blockchain, pool, uTxOPool) {
        super();

        this._blockchain = blockchain;
        this._mempool = pool;
        this._uTxOPool = uTxOPool;
    }

    _getBlocks() {

    }

    get blockchain() {
        return this._blockchain;
    }

    get mempool() {
        return this._mempool;
    }

    get uTxOPool() {
        return this._uTxOPool;
    }
}

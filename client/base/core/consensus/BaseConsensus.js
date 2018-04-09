class BaseConsensus extends Observable {
    constructor(blockchain, pool, uTxOPool) {
        super();

        this._blockchain = blockchain;
        this._mempool = pool;
        this._uTxOPool = uTxOPool;
    }

    _getBlocks() {

    }
}
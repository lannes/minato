if (typeof require !== 'undefined') {
    global.Observable = require('../../util/Observable');
}

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

if (typeof module !== 'undefined')
    module.exports = BaseConsensus;

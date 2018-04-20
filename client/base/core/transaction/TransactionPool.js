if (typeof require !== 'undefined') {
    global.KBuffer = require('../../utils/Buffer');
    global.Observable = require('../../utils/Observable');
    global.Transaction = require('./Transaction');
}

class TransactionPool extends Observable {
    constructor() {
        super();

        this._transactions = [];
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const transactions = obj.transactions.map(tx => Transaction.clone(tx));
        return new TransactionPool(transactions);
    }

    get transactions() {
        return this._transactions;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        buf.writeUint16(this._transactions.length);

        for (const tx of this._transactions) {
            tx.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        const size = buf.readUint16();
        const transactions = new Array(size);
        for (let i = 0; i < size; i++) {
            transactions[i] = Transaction.deserialize(buf);
        }

        return new TransactionPool(transactions);
    }

    get serializeSize() {
        let size = 2; /* size of transactions */

        for (const tx of this._transactions) {
            size += tx.serializeSize;
        }

        return size;
    }

    getTxPoolIns() {
        return this._transactions.reduce((sum, tx) => sum.concat(tx.txIns), []);
    }

    _containsTxIn(txIns, txIn) {
        const tmp = txIns.find(
            tx => txIn.txOutIndex === tx.txOutIndex && txIn.txOutId.equals(tx.txOutId)
        );
        return tmp !== undefined;
    }

    verify(tx) {
        const txPoolIns = this.getTxPoolIns();

        for (const txIn of tx.txIns) {
            if (this._containsTxIn(txPoolIns, txIn)) {
                console.log('txIn already found in the txPool');
                return false;
            }
        }

        return true;
    }

    add(tx, unspentTxOuts) {
        if (!tx.verify(unspentTxOuts)) {
            throw Error('Trying to add invalid tx to pool');
        }

        if (!this.verify(tx)) {
            throw Error('Trying to add invalid tx to pool');
        }

        this._transactions.push(tx);
    }

    hasTxIn(txIn, unspentTxOuts) {
        const foundTxIn = unspentTxOuts.find((tx) => {
            return tx.txOutId.equals(txIn.txOutId) && tx.txOutIndex === txIn.txOutIndex;
        });

        return foundTxIn !== undefined;
    }

    update(unspentTxOuts) {
        const invalidTxs = [];
        for (const tx of this._transactions) {
            for (const txIn of tx.txIns) {
                if (!this.hasTxIn(txIn, unspentTxOuts)) {
                    invalidTxs.push(tx);
                    break;
                }
            }
        }

        if (invalidTxs.length > 0) {
            this._transactions = this._transactions.filter(tx => !invalidTxs.includes(tx));
            this.notify('transactions-ready', this);
        }
    }
}

if (typeof module !== 'undefined')
    module.exports = TransactionPool;

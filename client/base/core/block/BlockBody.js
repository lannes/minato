
if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/buffer');
    global.KHash = require('../nodejs/crypto/Hash');
    global.Transaction = require('../transaction/Transaction');
}

class BlockBody {
    constructor(transactions) {
        if (!Array.isArray(transactions) || transactions.some(tx => !(tx instanceof Transaction)))
            throw Error('Invalid transactions');

        this._transactions = transactions;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const transactions = obj.transactions.map(tx => Transaction.clone(tx));
        return new BlockBody(transactions);
    }

    equals(obj) {
        return obj instanceof BlockBody
            && this._transactions.length === obj.transactions.length
            && this._transactions.every((tx, i) => tx.equals(obj.transactions[i]));
    }

    verify() {
        return true;
    }

    get transactions() {
        return this._transactions;
    }

    get transactionCount() {
        return this._transactions.length;
    }

    hash() {
        if (!this._hash) {
            this._hash = new Hash(KHash.sha256(this.serialize()));
        }

        return this._hash;
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

        return new BlockBody(transactions);
    }

    get serializeSize() {
        let size = 2; /* length of transactions */

        for (const tx of this._transactions) {
            size += tx.serializeSize;
        }

        return size;
    }
}

if (typeof module !== 'undefined')
    module.exports = BlockBody;
if (typeof require !== 'undefined') {
    global.Message = require('./Message');
    global.KBuffer = require('../../util/Buffer');
    global.Block = require('../../core/transaction/Transaction');
}

class PoolMessage extends Message {
    constructor(transactions) {
        super(Message.Type.POOL);
        this._transactions = transactions;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);

        buf.writeUint16(this._transactions.length);
        for (const tx of this._transactions) {
            tx.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);

        const size = buf.readUint16();
        const transactions = [];
        for (let i = 0; i < size; i++) {
            transactions.push(Transaction.deserialize(buf));
        }

        return new PoolMessage(transactions);
    }

    get serializeSize() {
        return super.serializeSize
            + 2 /* size of transactions */
            + this._transactions.reduce((sum, tx) => sum + tx.serializeSize, 0);
    }

    get transactions() {
        return this._transactions;
    }
}

if (typeof module !== 'undefined')
    module.exports = PoolMessage;
if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.KHash = require('../../../nodejs/crypto/Hash');
    global.KElliptic = require('../../crypto/elliptic');
    global.Hash = require('../common/Hash');
    global.Address = require('../common/Address');
    global.Signature = require('../common/Signature');
    global.GenesisConfig = require('../consensus/GenesisConfig');
    global.TransactionInput = require('./TransactionInput');
    global.TransactionOutput = require('./TransactionOutput');
    global.UnspentTransactionOutput = require('./UnspentTransactionOutput');
}

class Transaction {
    constructor(id, txIns, txOuts) {
        if (!(id instanceof Hash))
            throw Error('Transaction: Malformed id');
        if (!Array.isArray(txIns) || txIns.some(tx => !(tx instanceof TransactionInput)))
            throw Error('Transaction: Malformed transactions input');
        if (!Array.isArray(txOuts) || txOuts.some(tx => !(tx instanceof TransactionOutput)))
            throw Error('Transaction: Malformed transactions output');

        this._id = id;
        this._txIns = txIns;
        this._txOuts = txOuts;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const id = Hash.clone(obj.id);
        const txIns = obj.txIns.map(tx => TransactionInput.clone(tx));
        const txOuts = obj.txOuts.map(tx => TransactionOutput.clone(tx));

        return new Transaction(id, txIns, txOuts);
    }

    equals(obj) {
        return obj instanceof Transaction
            && this._txIns.length === obj.txIns.length
            && this._txIns.every((tx, i) => tx.equals(obj.txIns[i]))
            && this._txOuts.length === obj.txOuts.length
            && this._txOuts.every((tx, i) => tx.equals(obj.txOuts[i]));
    }

    toString() {
        return `{`
            + `id: ${this._id.hex}`
            + `}`;
    }

    get id() {
        return this._id;
    }

    get txIns() {
        return this._txIns;
    }

    get txOuts() {
        return this._txOuts;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        this._id.serialize(buf);

        buf.writeUint16(this._txIns.length);
        for (const tx of this._txIns) {
            tx.serialize(buf);
        }

        buf.writeUint16(this._txOuts.length);
        for (const tx of this._txOuts) {
            tx.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        const id = Hash.deserialize(buf);

        const sizeOftxIns = buf.readUint16();
        const txIns = new Array(sizeOftxIns);
        for (let i = 0; i < sizeOftxIns; i++) {
            txIns[i] = TransactionInput.deserialize(buf);
        }

        const sizeOftxOuts = buf.readUint16();
        const txOuts = new Array(sizeOftxOuts);
        for (let i = 0; i < sizeOftxOuts; i++) {
            txOuts[i] = TransactionOutput.deserialize(buf);
        }

        return new Transaction(id, txIns, txOuts);
    }

    get serializeSize() {
        let size = this._id.serializeSize /* id */
            + 2 /* size of txIns */
            + 2 /* size of txOuts */;

        for (const tx of this._txIns) {
            size += tx.serializeSize;
        }

        for (const tx of this._txOuts) {
            size += tx.serializeSize;
        }

        return size;
    }

    serializeContent(buf) {
        buf = buf || new KBuffer(this.serializeContentSize);

        buf.writeUint16(this._txIns.length);
        for (const tx of this._txIns) {
            tx.serializeContent(buf);
        }

        buf.writeUint16(this._txOuts.length);
        for (const tx of this._txOuts) {
            tx.serialize(buf);
        }

        return buf;
    }

    get serializeContentSize() {
        let size = 2 /* size of txIns */
            + 2 /* size of txOuts */;

        for (const tx of this._txIns) {
            size += tx.serializeContentSize;
        }

        for (const tx of this._txOuts) {
            size += tx.serializeSize;
        }

        return size;
    }

    getId() {
        return new Hash(KHash.sha256(this.serializeContent()));
    }

    static findUnspentTxOut(txId, index, unspentTxOuts) {
        return unspentTxOuts.find((tx) => txId.equals(tx.txOutId) && tx.txOutIndex === index);
    }

    static getTxInAmount(txIn, unspentTxOuts) {
        return Transaction.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, unspentTxOuts).amount;
    }

    verify(unspentTxOuts) {
        if (!this.getId().equals(this._id)) {
            console.log(`${this.getId().hex} != ${this._id.hex}`);
            return false;
        }

        const hasValidTxIns = this._txIns.every(tx => tx.verify(this._id, unspentTxOuts));
        if (!hasValidTxIns) {
            console.log(`some of the txIns are invalid in tx: ${this._id.hex}`);
            return false;
        }

        const totalTxInValues = this._txIns
            .map((tx) => Transaction.getTxInAmount(tx, unspentTxOuts))
            .reduce((sum, amount) => sum + amount, 0);

        const totalTxOutValues = this._txOuts.reduce((sum, tx) => sum + tx.amount, 0);

        if (totalTxOutValues !== totalTxInValues) {
            console.log(`totalTxOutValues !== totalTxInValues in tx: ${this._id.hex}`);
            return false;
        }

        return true;
    }

    verifyRewardTx(blockIndex) {
        if (!this.getId().equals(this._id)) {
            console.log(`${this.getId().hex} != ${this._id.hex}`);
            return false;
        }

        if (this._txIns.length !== 1) {
            return;
        }

        if (this._txIns[0].txOutIndex !== blockIndex) {
            return false;
        }

        if (this._txOuts.length !== 1) {
            return false;
        }

        if (blockIndex !== 0 && this._txOuts[0].amount !== GenesisConfig.MINING_REWARD) {
            return false;
        }

        if (blockIndex === 0 && this._txOuts[0].amount !== GenesisConfig.GENESIS_AMOUNT) {
            console.log(`${this._txOuts[0].amount} != ${GenesisConfig.GENESIS_AMOUNT}`);
            return false;
        }

        return true;
    }

    static verifyDouble(transactions) {
        let counts = {};

        for (const tx of transactions) {
            for (const txIns of tx.txIns) {
                const key = txIns.txOutId.hex + txIns.txOutIndex;
                counts[key] = (counts[key] || 0) + 1;
                if (counts[key] > 1) {
                    console.log(`duplicate ${txIns.txOutId.hex} ${txIns.txOutIndex}`);
                    return true;
                }
            }
        }

        return false;
    }

    static verifyBlockTransactions(transactions, unspentTxOuts, blockIndex) {
        const rewardTx = transactions[0];
        if (!rewardTx.verifyRewardTx(blockIndex)) {
            console.log('invalid coinbase transaction: ' + JSON.stringify(rewardTx));
            return false;
        }

        if (Transaction.verifyDouble(transactions)) {
            return false;
        }

        const normalTransactions = transactions.slice(1);
        return normalTransactions.every((tx) => tx.verify(unspentTxOuts));
    }

    static createFee(address, blockIndex) {
        const transaction = new Transaction(
            new Hash(null),
            [new TransactionInput(new Signature(null), new Hash(null), blockIndex)],
            [new TransactionOutput(address, GenesisConfig.FEE_PER_TRANSACTION)]
        );

        transaction._id = transaction.getId();
        return transaction;
    }

    static createReward(address, blockIndex) {
        const transaction = new Transaction(
            new Hash(null),
            [new TransactionInput(new Signature(null), new Hash(null), blockIndex)],
            [new TransactionOutput(address, GenesisConfig.MINING_REWARD)]
        );

        transaction._id = transaction.getId();
        return transaction;
    }

    signTxIn(privateKey, unspentTxOuts) {
        const msg = this._id.value;
        const signature = KElliptic.sign(privateKey, msg);

        for (let index = 0; index < this._txIns.length; index++) {
            const txIn = this._txIns[index];

            const referencedUnspentTxOut = Transaction.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, unspentTxOuts);
            if (referencedUnspentTxOut == null) {
                console.log('could not find referenced txOut');
                throw Error();
            }
            const referencedAddress = referencedUnspentTxOut.address;

            if (!Wallet.address.equals(referencedAddress)) {
                console.log('key that does not match the address that is referenced in txIn');
                throw Error();
            }

            // FIX ME
            this._txIns[index]._signature._value = signature;
        }
    }

    static updateUnspentTxOuts(transactions, unspentTxOuts) {
        const newUnspentTxOuts = transactions
            .map((tx) => {
                return tx.txOuts.map((txOut, index) => {
                    return new UnspentTransactionOutput(tx.id, index, txOut.address, txOut.amount);
                });
            })
            .reduce((arr, value) => arr.concat(value), []);

        const consumedTxOuts = transactions
            .reduce((arr, tx) => arr.concat(tx.txIns), [])
            .map((txIn) => {
                return new UnspentTransactionOutput(txIn.txOutId, txIn.txOutIndex, new Address(null), 0);
            });

        const resultingUnspentTxOuts = unspentTxOuts
            .filter(((tx) => !Transaction.findUnspentTxOut(tx.txOutId, tx.txOutIndex, consumedTxOuts)))
            .concat(newUnspentTxOuts);

        return resultingUnspentTxOuts;
    }

    static process(transactions, unspentTxOuts, blockIndex) {
        if (!Transaction.verifyBlockTransactions(transactions, unspentTxOuts, blockIndex)) {
            console.log('invalid block transactions');
            return null;
        }

        return Transaction.updateUnspentTxOuts(transactions, unspentTxOuts);
    }
}

if (typeof module !== 'undefined')
    module.exports = Transaction;

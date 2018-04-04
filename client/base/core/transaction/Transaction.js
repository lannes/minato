if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.KHash = require('../nodejs/crypto/hash');
    global.KElliptic = require('../../crypto/elliptic');
    global.TransactionInput = require('../transaction/TransactionInput');
    global.TransactionOut = require('../transaction/TransactionOutput');
    global.UnspentTransactionOutput = require('../transaction/UnspentTransactionOutput');
    global.Block = require('../block/Block');
}

class Transaction {
    constructor(id, txIns, txOuts) {
        if (id && !(id instanceof Uint8Array))
            throw Error('Invalid id');
        if (!Array.isArray(txIns) || txIns.some(it => !(it instanceof TransactionInput)))
            throw Error('Invalid transactions input');
        if (!Array.isArray(txOuts) || txOuts.some(it => !(it instanceof TransactionOutput)))
            throw Error('Invalid transactions output');

        this._id = id;
        this._txIns = txIns;
        this._txOuts = txOuts;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const txIns = obj.txIns.map(it => TransactionInput.clone(it));
        const txOuts = obj.txOuts.map(it => TransactionOutput.clone(it));

        return new Transaction(obj.id, txIns, txOuts);
    }

    equals(obj) {
        return obj instanceof Transaction
            && this._txIns.length === obj.txIns.length
            && this._txIns.every((tx, i) => tx.equals(obj.txIns[i]))
            && this._txOuts.length === obj.txOuts.length
            && this._txOuts.every((tx, i) => tx.equals(obj.txOuts[i]));
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
        buf.write(this._id);

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
        const id = buf.read(32);

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
        let size = 32 /* id */
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
        return KHash.sha256(this.serializeContent());
    }

    static findUnspentTxOut(transactionId, index, unspentTxOuts) {
        return unspentTxOuts.find((it) => it.txOutId === transactionId && it.txOutIndex === index);
    }

    static getTxInAmount(txIn, unspentTxOuts) {
        return Transaction.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, unspentTxOuts).amount;
    }

    verify(unspentTxOuts) {
        if (!ArrayUtils.equals(this.getId(), this._id)) {
            console.log(`${ArrayUtils.toHex(this.getId())} != ${ArrayUtils.toHex(this._id)}`);
            return false;
        }

        const hasValidTxIns = this._txIns.every(tx => tx.verify(this._id, unspentTxOuts));
        if (!hasValidTxIns) {
            console.log(`some of the txIns are invalid in tx: ${ArrayUtils.toHex(this._id)}`);
            return false;
        }

        const totalTxInValues = this._txIns
            .map((tx) => Transaction.getTxInAmount(tx, unspentTxOuts))
            .reduce((sum, amount) => sum + amount, 0);

        const totalTxOutValues = this._txOuts.reduce((sum, tx) => sum + tx.amount, 0);

        if (totalTxOutValues !== totalTxInValues) {
            console.log(`totalTxOutValues !== totalTxInValues in tx: ${ArrayUtils.toHex(this._id)}`);
            return false;
        }

        return true;
    }

    verifyRewardTx(blockIndex) {
        if (!ArrayUtils.equals(this.getId(), this._id)) {
            console.log(`${ArrayUtils.toHex(this.getId)} != ${ArrayUtils.toHex(this._id)}`);
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

        if (blockIndex !== 0 && this._txOuts[0].amount !== GenesisConfig.BASE_AMOUNT) {
            return false;
        }

        if (blockIndex === 0 && this._txOuts[0].amount !== GenesisConfig.GENESIS_AMOUNT) {
            console.log(`${this._txOuts[0].amount} != ${GenesisConfig.GENESIS_AMOUNT}`);
            return false;
        }

        return true;
    }

    static hasDuplicates(txIns) {
        //const groups = txIns.countBy((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex);
        const groups = txIns.reduce((a, b) => {
            let key = b.txOutId + b.txOutIndex;
            a[key] = a[key] ? a[key] += 1 : 1;
            return a;
        }, {});

        for (let key in groups) {
            if (groups[key] > 1) {
                console.log('duplicate txIn: ' + key);
                return true;
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

        // check for duplicate txIns. Each txIn can be included only once
        const txIns = transactions
            .map((tx) => tx.txIns)
            .reduce((arr, value) => arr.concat(value), []);

        if (Transaction.hasDuplicates(txIns)) {
            return false;
        }

        // all but coinbase transactions
        const normalTransactions = transactions.slice(1);
        return normalTransactions.every((tx) => tx.verify(unspentTxOuts));
    }

    /**
     *  Thưởng 50 coin cho giao dịch
     */
    static createReward(address, blockIndex) {
        const transaction = new Transaction(
            null,
            [new TransactionInput(null, null, blockIndex)],
            [new TransactionOutput(address, GenesisConfig.BASE_AMOUNT)]
        );

        transaction._id = transaction.getId();
        return transaction;
    }

    signTxIn(privateKey, unspentTxOuts) {
        const dataToSign = this._id;
        const signature = KElliptic.sign(privateKey, dataToSign);

        for (let index = 0; index < this._txIns.length; index++) {
            const txIn = this._txIns[index];

            const referencedUnspentTxOut = Transaction.findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, unspentTxOuts);
            if (referencedUnspentTxOut == null) {
                console.log('could not find referenced txOut');
                throw Error();
            }
            const referencedAddress = referencedUnspentTxOut.address;

            if (!Wallet.getPublicFromWallet().equals(referencedAddress)) {
                console.log('trying to sign an input with private' +
                    ' key that does not match the address that is referenced in txIn');
                throw Error();
            }

            this._txIns[index]._signature = signature;
        }
    }

    static updateUnspentTxOuts(transactions, unspentTxOuts) {
        const newUnspentTxOuts = transactions
            .map((it) => {
                return it.txOuts.map((txOut, index) => {
                    return new UnspentTransactionOutput(it.id, index, txOut.address, txOut.amount);
                });
            })
            .reduce((arr, value) => arr.concat(value), []);

        const consumedTxOuts = transactions
            .reduce((arr, tx) => arr.concat(tx.txIns), [])
            .map((txIn) => {
                return new UnspentTransactionOutput(txIn.txOutId, txIn.txOutIndex, null, 0);
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

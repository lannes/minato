if (typeof require !== 'undefined') {
    global.KElliptic = require('../crypto/elliptic');
    global.KDatabase = require('../../nodejs/util/db');
    global.Transaction = require('./transaction/Transaction');
    global.TransactionOuput = require('./transaction/TransactionOutput');
}

var minato = minato || {};

class Wallet {
    constructor() {

    }

    static getPrivateFromWallet() {
        return minato.privateKey;
    }

    static getPublicFromWallet() {
        return new Address(new Uint8Array(minato.address));
    }

    static async initWallet() {
        const wallet = await KDatabase.getAll('wallet');
        if (wallet.length === 1) {
            minato.privateKey = KElliptic.importPrivateKey(wallet[0][0]);
            minato.address = wallet[0][1];
            return;
        }

        const keyPair = KElliptic.generateKeyPair();
        const privateData = KElliptic.generatePrivateData(keyPair.private);
        const publicData = KElliptic.generatePublicData(keyPair.public);

        minato.privateKey = KElliptic.importPrivateKey(keyPair.private);
        minato.address = publicData;

        await KDatabase.add('wallet', [privateData, publicData]);
    }

    static async deleteWallet() {
        await KDatabase.delete('hokage');
    }

    static findTxOutsForAmount(amount, unspentTxOuts) {
        let currentAmount = 0;
        let includedUnspentTxOuts = [];
        for (const myUnspentTxOut of unspentTxOuts) {
            includedUnspentTxOuts.push(myUnspentTxOut);
            currentAmount = currentAmount + myUnspentTxOut.amount;

            if (currentAmount >= amount) {
                const leftOverAmount = currentAmount - amount;
                return { includedUnspentTxOuts, leftOverAmount }
            }
        }

        throw new Error('not enough coins to send transaction');
    }

    static createTxOuts(receiverAddress, myAddress, amount, leftOverAmount) {
        const txOut1 = new TransactionOutput(receiverAddress, amount);

        if (leftOverAmount === 0) {
            return [txOut1];
        } else {
            const leftOverTx = new TransactionOuput(myAddress, leftOverAmount);
            return [txOut1, leftOverTx];
        }
    }

    static filterTxPoolTxs(unspentTxOuts, transactionPool) {
        const txIns = transactionPool.reduce((sum, tx) => sum.concat(tx.txIns), []);

        const removable = [];
        for (const unspentTxOut of unspentTxOuts) {
            const txIn = txIns.find((tx) => {
                return tx.txOutIndex === unspentTxOut.txOutIndex && ArrayUtils.equals(tx.txOutId, unspentTxOut.txOutId);
            });

            if (txIn === undefined) {
            } else {
                removable.push(unspentTxOut);
            }
        }

        return unspentTxOuts.filter(value => !removable.includes(value));
    }

    static createTransaction(receiverAddress, amount, privateKey, unspentTxOuts, txPool) {
        const myAddress = Wallet.getPublicFromWallet();
        const myUnspentTxOutsA = unspentTxOuts.filter((tx) => tx.address.equals(myAddress));

        const myUnspentTxOuts = Wallet.filterTxPoolTxs(myUnspentTxOutsA, txPool);

        // filter from unspentOutputs such inputs that are referenced in pool
        const { includedUnspentTxOuts, leftOverAmount } = Wallet.findTxOutsForAmount(amount, myUnspentTxOuts);

        const unsignedTxIns = includedUnspentTxOuts.map((tx) => {
            return new TransactionInput(null, tx.txOutId, tx.txOutIndex);
        });

        const tx = new Transaction(
            null,
            unsignedTxIns,
            Wallet.createTxOuts(receiverAddress, myAddress, amount, leftOverAmount)
        );

        // FIX ME
        tx._id = tx.getId();
        tx.signTxIn(privateKey, unspentTxOuts);

        return tx;
    }
}

if (typeof module !== 'undefined')
    module.exports = Wallet;

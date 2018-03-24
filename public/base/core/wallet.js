if (typeof require !== 'undefined') {
    global.KElliptic = require('../crypto/elliptic');
    global.KDatabase = require('../../nodejs/util/db');
}

var minato = minato || {};

class Wallet {
    static getPrivateFromWallet() {
        return minato.privateKey;
    }

    static getPublicFromWallet() {
        return minato.address;
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

    static isValidAddress(address) {
        if (address.length !== 130) {
            return false;
        } else if (address.match('^[a-fA-F0-9]+$') === null) {
            return false;
        } else if (!address.startsWith('04')) {
            return false;
        }

        return true;
    }

    static findTxOutsForAmount(amount, myUnspentTxOuts) {
        let currentAmount = 0;
        const includedUnspentTxOuts = [];
        for (const myUnspentTxOut of myUnspentTxOuts) {
            includedUnspentTxOuts.push(myUnspentTxOut);
            currentAmount = currentAmount + myUnspentTxOut['amount'];
            if (currentAmount >= amount) {
                const leftOverAmount = currentAmount - amount;
                return { includedUnspentTxOuts, leftOverAmount }
            }
        }

        throw Error('not enough coins to send transaction');
    }

    static createTxOuts(receiverAddress, myAddress, amount, leftOverAmount) {
        const txOut1 = {
            'address': receiverAddress,
            'amount': amount
        };

        if (leftOverAmount === 0) {
            return [txOut1];
        } else {
            const leftOverTx = {
                'address': myAddress,
                'amount': leftOverAmount
            };
            return [txOut1, leftOverTx];
        }
    }

    static filterTxPoolTxs(unspentTxOuts, transactionPool) {
        const txIns = transactionPool
            .map((tx) => tx['txIns'])
            .reduce((a, b) => a.concat(b), []);

        const removable = [];
        for (const unspentTxOut of unspentTxOuts) {
            const txIn = txIns.find((aTxIn) => {
                return aTxIn['txOutIndex'] === unspentTxOut['txOutIndex'] && aTxIn['txOutId'] === unspentTxOut['txOutId'];
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
        const myUnspentTxOutsA = unspentTxOuts.filter((uTxO) => uTxO['address'] === myAddress);

        const myUnspentTxOuts = Wallet.filterTxPoolTxs(myUnspentTxOutsA, txPool);

        // filter from unspentOutputs such inputs that are referenced in pool
        const { includedUnspentTxOuts, leftOverAmount } = Wallet.findTxOutsForAmount(amount, myUnspentTxOuts);

        const unsignedTxIns = includedUnspentTxOuts.map((unspentTxOut) => {
            return {
                'txOutId': unspentTxOut.txOutId,
                'txOutIndex': unspentTxOut.txOutIndex,
                'signature': ''
            };
        });

        const tx = {
            'id': '',
            'txIns': unsignedTxIns,
            'txOuts': Wallet.createTxOuts(receiverAddress, myAddress, amount, leftOverAmount)
        };
        tx['id'] = Transaction.getTransactionId(tx);

        tx['txIns'] = tx['txIns'].map((txIn, index) => {
            txIn['signature'] = Transaction.signTxIn(tx, index, privateKey, unspentTxOuts);
            return txIn;
        });

        return tx;
    }
}

if (typeof module !== 'undefined')
    module.exports = Wallet;

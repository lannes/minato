if (typeof require !== 'undefined') {
    global.KHash = require('../nodejs/crypto/hash');
}

const COINBASE_AMOUNT = 50;

class Transaction {
    static getTransactionId(transaction) {
        const txInContent = transaction['txIns']
            .map((txIn) => txIn['txOutId'] + txIn['txOutIndex'])
            .reduce((a, b) => a + b, '');

        const txOutContent = transaction['txOuts']
            .map((txOut) => txOut['address'] + txOut['amount'])
            .reduce((a, b) => a + b, '');

        return KHash.sha256(txInContent + txOutContent);
    }

    static getTxInAmount(txIn, aUnspentTxOuts) {
        return Transaction.findUnspentTxOut(txIn['txOutId'], txIn['txOutIndex'], aUnspentTxOuts)['amount'];
    }

    static findUnspentTxOut(transactionId, index, aUnspentTxOuts) {
        return aUnspentTxOuts.find((uTxO) => uTxO['txOutId'] === transactionId && uTxO['txOutIndex'] === index);
    }

    static isValidTxOutStructure(txOut) {
        if (txOut === null) {
            return false;
        }

        if (typeof txOut['address'] !== 'string') {
            return false;
        }

        if (!Wallet.isValidAddress(txOut['address'])) {
            return false;
        }

        if (typeof txOut['amount'] !== 'number') {
            return false;
        }

        return true;
    }

    static isValidTxInStructure(txIn) {
        if (txIn == null) {
            return false;
        }

        if (typeof txIn['signature'] !== 'string') {
            return false;
        }

        if (typeof txIn['txOutId'] !== 'string') {
            return false;
        }

        if (typeof txIn['txOutIndex'] !== 'number') {
            return false;
        }

        return true;
    }

    validateTxIn(txIn, transaction, aUnspentTxOuts) {
        const referencedUTxOut =
            aUnspentTxOuts.find((uTxO) => uTxO['txOutId'] === txIn['txOutId'] &&
                uTxO['txOutIndex'] === txIn['txOutIndex']);
        if (referencedUTxOut == null) {
            console.log('referenced txOut not found: ' + JSON.stringify(txIn));
            return false;
        }

        const address = referencedUTxOut['address'];
        const publicKey = KElliptic.importPublicKey(address);
        const validSignature = KElliptic.verify(publicKey, txIn['signature'], transaction['id']);
        if (!validSignature) {
            console.log('invalid txIn signature: %s txId: %s address: %s',
                txIn['signature'], transaction['id'], referencedUTxOut['address']);
            return false;
        }

        return true;
    }

    static isValidTransactionStructure(transaction) {
        if (typeof transaction['id'] !== 'string') {
            return false;
        }

        if (!(transaction['txIns'] instanceof Array)) {
            return false;
        }

        if (!transaction['txIns']
            .map(isValidTxInStructure)
            .reduce((a, b) => (a && b), true)) {
            return false;
        }

        if (!(transaction['txOuts'] instanceof Array)) {
            return false;
        }

        if (!transaction['txOuts']
            .map(Transaction.isValidTxOutStructure)
            .reduce((a, b) => (a && b), true)) {
            return false;
        }

        return true;
    }

    static validateTransaction(transaction, aUnspentTxOuts) {
        if (!Transaction.isValidTransactionStructure(transaction)) {
            return false;
        }

        if (Transaction.getTransactionId(transaction) !== transaction['id']) {
            return false;
        }

        const tmp = transaction['txIns'].map(
            (txIn) => this.validateTxIn(txIn, transaction, aUnspentTxOuts)
        );
        const hasValidTxIns = tmp.reduce((a, b) => a && b, true);

        if (!hasValidTxIns) {
            console.log('some of the txIns are invalid in tx: ' + transaction['id']);
            return false;
        }

        const totalTxInValues = transaction['txIns']
            .map((txIn) => Transaction.getTxInAmount(txIn, aUnspentTxOuts))
            .reduce((a, b) => (a + b), 0);

        const totalTxOutValues = transaction['txOuts']
            .map((txOut) => txOut.amount)
            .reduce((a, b) => (a + b), 0);

        if (totalTxOutValues !== totalTxInValues) {
            console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction['id']);
            return false;
        }

        return true;
    }

    static validateCoinbaseTx(transaction, blockIndex) {
        if (transaction == null) {
            return false;
        }

        if (Transaction.getTransactionId(transaction) !== transaction['id']) {
            return false;
        }

        if (transaction['txIns'].length !== 1) {
            return;
        }

        if (transaction['txIns'][0].txOutIndex !== blockIndex) {
            return false;
        }

        if (transaction['txOuts'].length !== 1) {
            return false;
        }

        if (transaction['txOuts'][0].amount !== COINBASE_AMOUNT) {
            return false;
        }

        return true;
    }

    static hasDuplicates(txIns) {
        //const groups = txIns.countBy((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex);
        const groups = txIns.reduce((a, b) => {
            let key = b['txOutId'] + b['txOutIndex'];
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

    static validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex) {
        const coinbaseTx = aTransactions[0];
        if (!Transaction.validateCoinbaseTx(coinbaseTx, blockIndex)) {
            console.log('invalid coinbase transaction: ' + JSON.stringify(coinbaseTx));
            return false;
        }

        // check for duplicate txIns. Each txIn can be included only once
        const txIns = aTransactions
            .map((tx) => tx['txIns'])
            .reduce((a, b) => a.concat(b), []);

        if (Transaction.hasDuplicates(txIns)) {
            return false;
        }

        // all but coinbase transactions
        const normalTransactions = aTransactions.slice(1);
        const tmp = normalTransactions.map(
            (tx) => Transaction.validateTransaction(tx, aUnspentTxOuts)
        );
        return tmp.reduce((a, b) => (a && b), true);
    }

    /**
     *  Thưởng 50 Coinbase cho giao dịch
     */
    static getCoinbaseTransaction(address, blockIndex) {
        const txIn = {
            'signature': '',
            'txOutId': '',
            'txOutIndex': blockIndex
        };

        const t = {
            'id': '',
            'txIns': [txIn],
            'txOuts': [{
                'address': address,
                'amount': COINBASE_AMOUNT
            }]
        };

        t['id'] = Transaction.getTransactionId(t);
        return t;
    }

    static signTxIn(transaction, txInIndex, privateKey, aUnspentTxOuts) {
        const txIn = transaction['txIns'][txInIndex];

        const dataToSign = transaction['id'];
        const referencedUnspentTxOut = Transaction.findUnspentTxOut(txIn['txOutId'], txIn['txOutIndex'], aUnspentTxOuts);
        if (referencedUnspentTxOut == null) {
            console.log('could not find referenced txOut');
            throw Error();
        }
        const referencedAddress = referencedUnspentTxOut['address'];

        if (Wallet.getPublicFromWallet() !== referencedAddress) {
            console.log('trying to sign an input with private' +
                ' key that does not match the address that is referenced in txIn');
            throw Error();
        }

        const signature = Elliptic.sign(privateKey, dataToSign);
        return signature;
    }

    static updateUnspentTxOuts(aTransactions, aUnspentTxOuts) {
        const newUnspentTxOuts = aTransactions
            .map((t) => {
                return t['txOuts'].map((txOut, index) => {
                    return {
                        'txOutId': t.id,
                        'txOutIndex': index,
                        'address': txOut['address'],
                        'amount': txOut['amount']
                    };
                });
            })
            .reduce((a, b) => a.concat(b), []);

        const consumedTxOuts = aTransactions
            .map((t) => t['txIns'])
            .reduce((a, b) => a.concat(b), [])
            .map((txIn) => {
                return {
                    'txOutId': txIn['txOutId'],
                    'txOutIndex': txIn['txOutIndex'],
                    'address': '',
                    'amount': 0
                };
            });

        const resultingUnspentTxOuts = aUnspentTxOuts
            .filter(((uTxO) => !Transaction.findUnspentTxOut(uTxO['txOutId'], uTxO['txOutIndex'], consumedTxOuts)))
            .concat(newUnspentTxOuts);

        return resultingUnspentTxOuts;
    }

    static process(aTransactions, aUnspentTxOuts, blockIndex) {
        if (!Transaction.validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
            console.log('invalid block transactions');
            return null;
        }

        return Transaction.updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
    }
}

if (typeof module !== 'undefined')
    module.exports = Transaction;

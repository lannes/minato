class TransactionPool {
    constructor() {
        this.transactionPool = [];
    }

    getTransactionPool() {
        return cloneDeep(this.transactionPool);
    }

    isValidTxForPool(tx, aTtransactionPool) {
        const txPoolIns = this.getTxPoolIns(aTtransactionPool);

        const containsTxIn = (txIns, txIn) => {
            const tmp = txIns.find(txPoolIn => {
                return txIn['txOutIndex'] === txPoolIn['txOutIndex'] && txIn['txOutId'] === txPoolIn['txOutId']
            });

            return tmp !== undefined;
        }

        for (const txIn of tx['txIns']) {
            if (containsTxIn(txPoolIns, txIn)) {
                console.log('txIn already found in the txPool');
                return false;
            }
        }

        return true;
    }

    async addToTransactionPool(tx, unspentTxOuts) {
        if (!(await Transaction.validateTransaction(tx, unspentTxOuts))) {
            throw Error('Trying to add invalid tx to pool');
        }

        if (!this.isValidTxForPool(tx, this.transactionPool)) {
            throw Error('Trying to add invalid tx to pool');
        }

        this.transactionPool.push(tx);
    }

    getTxPoolIns(aTransactionPool) {
        return aTransactionPool
            .map((tx) => tx['txIns'])
            .reduce((a, b) => a.concat(b), []);
    }

    hasTxIn(txIn, unspentTxOuts) {
        const foundTxIn = unspentTxOuts.find((uTxO) => {
            return uTxO['txOutId'] === txIn['txOutId'] && uTxO['txOutIndex'] === txIn['txOutIndex'];
        });

        return foundTxIn !== undefined;
    }

    updateTransactionPool(unspentTxOuts) {
        const invalidTxs = [];
        for (const tx of this.transactionPool) {
            for (const txIn of tx['txIns']) {
                if (!this.hasTxIn(txIn, unspentTxOuts)) {
                    invalidTxs.push(tx);
                    break;
                }
            }
        }

        if (invalidTxs.length > 0) {
            this.transactionPool = this.transactionPool.filter(value => !invalidTxs.includes(value));
        }
    }
}

if (typeof module !== 'undefined')
    module.exports = TransactionPool;
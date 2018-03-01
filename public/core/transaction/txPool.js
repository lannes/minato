let transactionPool = [];

const getTransactionPool = () => {
    return cloneDeep(transactionPool);
}

const isValidTxForPool = (tx, aTtransactionPool) => {
    const txPoolIns = getTxPoolIns(aTtransactionPool);

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

const addToTransactionPool = async (tx, unspentTxOuts) => {
    if (!(await validateTransaction(tx, unspentTxOuts))) {
        throw Error('Trying to add invalid tx to pool');
    }

    if (!isValidTxForPool(tx, transactionPool)) {
        throw Error('Trying to add invalid tx to pool');
    }

    transactionPool.push(tx);
}

const getTxPoolIns = (aTransactionPool) => {
    return aTransactionPool
        .map((tx) => tx['txIns'])
        .reduce((a, b) => a.concat(b), []);
}

const hasTxIn = (txIn, unspentTxOuts) => {
    const foundTxIn = unspentTxOuts.find((uTxO) => {
        return uTxO['txOutId'] === txIn['txOutId'] && uTxO['txOutIndex'] === txIn['txOutIndex'];
    });

    return foundTxIn !== undefined;
}

const updateTransactionPool = (unspentTxOuts) => {
    const invalidTxs = [];
    for (const tx of transactionPool) {
        for (const txIn of tx['txIns']) {
            if (!hasTxIn(txIn, unspentTxOuts)) {
                invalidTxs.push(tx);
                break;
            }
        }
    }

    if (invalidTxs.length > 0) {
        console.log('removing the following transactions from txPool: %s', JSON.stringify(invalidTxs));
        transactionPool = transactionPool.filter(value => !invalidTxs.includes(value));
    }
}
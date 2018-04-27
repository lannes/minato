class Wallet {
    constructor() {

    }

    static get privateKey() {
        return Wallet.keys.private;
    }

    static get publicKey() {
        return Wallet.keys.public;
    }

    static get address() {
        return new Address(Wallet.keys.public);
    }

    static async init() {
        const wallet = await KDatabase.getAll('wallet');
        if (wallet.length === 1) {
            Wallet.keys.private = wallet[0][0];
            Wallet.keys.public = wallet[0][1];
            return;
        }

        Wallet.keys = KElliptic.generateKeyPair();
        await KDatabase.add('wallet', [Wallet.keys.private, Wallet.keys.public]);
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

        throw Error('not enough coins to send transaction');
    }

    static createTxOuts(receiverAddress, myAddress, amount, leftOverAmount) {
        const txOut = new TransactionOutput(receiverAddress, amount);

        if (leftOverAmount === 0) {
            return [txOut];
        } else {
            const leftOverTx = new TransactionOutput(myAddress, leftOverAmount);
            return [txOut, leftOverTx];
        }
    }

    static filterTxPoolTxs(unspentTxOuts, transactionPool) {
        const txIns = transactionPool.reduce((sum, tx) => sum.concat(tx.txIns), []);

        let removable = [];
        for (const unspentTxOut of unspentTxOuts) {
            const txIn = txIns.find((tx) => {
                return tx.txOutIndex === unspentTxOut.txOutIndex && tx.txOutId.equals(unspentTxOut.txOutId);
            });

            if (txIn === undefined) {
            } else {
                removable.push(unspentTxOut);
            }
        }

        return unspentTxOuts.filter(value => !removable.includes(value));
    }

    static createTransaction(receiverAddress, amount, privateKey, unspentTxOuts, txPool) {
        const myAddress = Wallet.address;
        const myUnspentTxOutsA = unspentTxOuts.filter((tx) => tx.address.equals(myAddress));

        const myUnspentTxOuts = Wallet.filterTxPoolTxs(myUnspentTxOutsA, txPool);

        // filter from unspentOutputs such inputs that are referenced in pool
        const { includedUnspentTxOuts, leftOverAmount } = Wallet.findTxOutsForAmount(amount, myUnspentTxOuts);

        const unsignedTxIns = includedUnspentTxOuts.map((tx) => {
            return new TransactionInput(new Signature(null), tx.txOutId, tx.txOutIndex);
        });

        const tx = new Transaction(
            new Hash(null),
            unsignedTxIns,
            Wallet.createTxOuts(receiverAddress, myAddress, amount, leftOverAmount)
        );

        // FIX ME
        tx._id = tx.getId();
        tx.signTxIn(privateKey, unspentTxOuts);

        return tx;
    }
}

Wallet.keys = {};


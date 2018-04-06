class UnspentTransactionOutputPool {
    constructor() {
        this._transactions = Transaction.process(GenesisConfig.GENESIS_BLOCK.transactions, [], 0);
    }

    get transactions() {
        return this._transactions;
    }

    update(transactions) {
        this._transactions = transactions;
    }
}
class UnspentTransactionOutput {
    constructor(txOutId, txOutIndex, address, amount) {
        if (!(txOutId instanceof Hash))
            throw Error('Invalid txOutId');
        if (!(address instanceof Address))
            throw Error('Invalid addess');

        this._txOutId = txOutId;
        this._txOutIndex = txOutIndex;
        this._address = address;
        this._amount = amount;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const txOutId = Hash.clone(obj.txOutId);
        const address = Address.clone(obj.address);
        return new UnspentTransactionOutput(txOutId, obj.txOutIndex, address, obj.amount);
    }

    equals(obj) {
        return obj instanceof UnspentTransactionOutput
            && this._txOutId.equals(obj.txOutId)
            && this._txOutIndex === obj.txOutIndex
            && this._address.equals(obj.address)
            && this._amount === obj.amount
    }

    get txOutId() {
        return this._txOutId;
    }

    get txOutIndex() {
        return this._txOutIndex;
    }

    get address() {
        return this._address;
    }

    get amount() {
        return this._amount;
    }
}

if (typeof module !== 'undefined')
    module.exports = UnspentTransactionOutput;


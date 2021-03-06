class TransactionOutput {
    constructor(address, amount) {
        if (!(address instanceof Address))
            throw Error('TransactionOutput: Malformed Address');
        if (!NumberUtils.isUint64(amount))
            throw Error(`TransactionOutput: Malformed Amount ${amount}`);
        if (amount < 0)
            throw Error(`TransactionOutput: Invalid Amount ${amount}`);

        this._address = address;
        this._amount = amount;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const address = Address.clone(obj.address);
        return new TransactionOutput(address, obj.amount);
    }

    equals(obj) {
        return obj instanceof TransactionOutput
            && this._address.equals(obj.address)
            && this._amount === obj.amount;
    }

    get address() {
        return this._address;
    }

    get amount() {
        return this._amount;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        this._address.serialize(buf);
        buf.writeUint64(this._amount);

        return buf;
    }

    static deserialize(buf) {
        const address = Address.deserialize(buf);
        const amount = buf.readUint64();

        return new TransactionOutput(address, amount);
    }

    get serializeSize() {
        return this._address.serializeSize /* address */
            + 8 /* amount */;
    }
}

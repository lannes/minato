
if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.NumberUtils = require('../../util/NumberUtils');
    global.Address = require('../Address');
}

class TransactionOutput {
    constructor(address, amount) {
        if (!(address instanceof Address))
            throw Error('Invalid Address');
        if (!NumberUtils.isUint64(amount) || amount < 0)
            throw Error('Invalid Amount');

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
        const value = buf.read(Address.SERIALIZE_SIZE);
        const address = new Address(value);
        const amount = buf.readUint64();
        return new TransactionOutput(address, amount);
    }

    get serializeSize() {
        return Address.SERIALIZE_SIZE + /* address */
            8 /* amount */;
    }
}

if (typeof module !== 'undefined')
    module.exports = TransactionOutput;
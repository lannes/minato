if (typeof require !== 'undefined') {
    global.KBuffer = require('../util/Buffer');
    global.ArrayUtils = require('../util/ArrayUtils');
}

class Address {
    constructor(value) {
        if (!(value instanceof Uint8Array))
            throw Error('Invalid type');

        if (value.length !== Address.SERIALIZE_SIZE)
            throw Error('Invalid length');

        this._value = value;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const value = new Uint8Array(obj.value);
        return new Address(value);
    }

    equals(obj) {
        return obj instanceof Address
            && ArrayUtils.equals(this._value, obj.value);
    }

    get value() {
        return this._value;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        buf.write(this._value);
        return buf;
    }

    deserialize(buf) {
        return new Address(buf.read(this.serializeSize));
    }

    get serializeSize() {
        return Address.SERIALIZE_SIZE;
    }

    get base64() {
        return ArrayUtils.toBase64(this._value);
    }

    static fromBase64(base64) {
        return new Address(ArrayUtils.fromBase64(base64));
    }
}

Address.SERIALIZE_SIZE = 65;

if (typeof module !== 'undefined')
    module.exports = Address;
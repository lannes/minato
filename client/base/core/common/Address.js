if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.ArrayUtils = require('../../util/ArrayUtils');
}

class Address {
    constructor(value) {
        if (value !== null) {
            if (!(value instanceof Uint8Array))
                throw Error('Invalid type');

            if (value.length !== Address.SERIALIZE_SIZE)
                throw Error('Invalid length');
        }

        this._value = value;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        let value = null;
        if (obj.value !== null)
            value = new Uint8Array(obj.value);

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

        if (this._value) {
            buf.writeUint8(1);
            buf.write(this._value);
        } else {
            buf.writeUint8(0);
        }

        return buf;
    }

    static deserialize(buf) {
        let value = null;
        const valuePresent = buf.readUint8();
        if (valuePresent)
            value = buf.read(Address.SERIALIZE_SIZE);

        return new Address(value);
    }

    get serializeSize() {
        return 1 /* valuePresent */
            + (this._value ? Address.SERIALIZE_SIZE : 0);
    }

    get base64() {
        return ArrayUtils.toBase64(this._value);
    }

    static fromBase64(base64) {
        return new Address(ArrayUtils.fromBase64(base64));
    }

    get hex() {
        return ArrayUtils.toHex(this._value);
    }
    
    static fromHex(hex) {
        return new Address(ArrayUtils.fromHex(hex));
    }

    static fromHash(hash) {
        return new Address(hash.subarray(0, Address.SERIALIZE_SIZE));
    }
}

Address.SERIALIZE_SIZE = 32;

if (typeof module !== 'undefined')
    module.exports = Address;
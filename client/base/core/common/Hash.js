if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.ArrayUtils = require('../../util/ArrayUtils');
}

class Hash {
    constructor(value) {
        if (value !== null) {
            if (!(value instanceof Uint8Array))
                throw Error('Invalid type');

            if (value.length !== Hash.SERIALIZE_SIZE)
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

        return new Hash(value);
    }

    equals(obj) {
        return obj instanceof Hash
            && ArrayUtils.equals(this._value, obj.value);
    }

    get value() {
        return this._value;
    }

    subarray(begin, end) {
        return this._value.subarray(begin, end);
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
            value = buf.read(Hash.SERIALIZE_SIZE);

        return new Hash(value);
    }

    get serializeSize() {
        return 1 /* valuePresent */
            + (this._value ? Hash.SERIALIZE_SIZE : 0);
    }

    get hex() {
        return ArrayUtils.toHex(this._value);
    }

    static fromHex(hex) {
        return new Hash(ArrayUtils.fromHex(hex));
    }
}

Hash.SERIALIZE_SIZE = 32;

if (typeof module !== 'undefined')
    module.exports = Hash;
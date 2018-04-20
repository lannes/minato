if (typeof require !== 'undefined') {
    global.KBuffer = require('../../utils/Buffer');
    global.ArrayUtils = require('../../utils/ArrayUtils');
    global.KElliptic = require('../../crypto/Elliptic');
}

class Signature {
    constructor(value) {
        if (value !== null) {
            if (!(value instanceof Uint8Array))
                throw Error('Invalid type');

            if (value.length !== Signature.SERIALIZE_SIZE)
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

        return new Signature(value);
    }

    equals(obj) {
        return obj instanceof Signature
            && ArrayUtils.equals(this._value, obj.value);
    }

    get value() {
        return this._value;
    }

    static create(privateKey, msg) {
        return new Signature(KElliptic.sign(privateKey, msg));
    }

    verify(publicKey, msg) {
        return KElliptic.verify(publicKey, this._value, msg);
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
            value = buf.read(Signature.SERIALIZE_SIZE);

        return new Signature(value);
    }

    get serializeSize() {
        return 1 /* valuePresent */
            + (this._value ? Signature.SERIALIZE_SIZE : 0);
    }

    get base64() {
        return ArrayUtils.toBase64(this._value);
    }

    static fromBase64(base64) {
        return new Signature(ArrayUtils.fromBase64(base64));
    }

    get hex() {
        return ArrayUtils.toHex(this._value);
    }

    static fromHex(hex) {
        return new Hash(ArrayUtils.fromHex(hex));
    }
}

Signature.SERIALIZE_SIZE = 64;

if (typeof module !== 'undefined')
    module.exports = Signature;
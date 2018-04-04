if (typeof require !== 'undefined') {
    global.Primitive = require('../util/Primitive');
    global.BufferUtils = require('../util/BufferUtils');
    global.KHash = require('../nodejs/crypto/hash');
}

class Hash extends Primitive {
    static copy(o) {
        if (!o)
            return o;

        const obj = new Uint8Array(o._obj);
        return new Hash(obj);
    }

    constructor(arg) {
        if (arg === null) {
            arg = new Uint8Array(32);
        }
        super(arg, Uint8Array, 32);
    }

    static light(arr) {
        return new Hash(KHash.sha256(arr));
    }

    static unserialize(buf) {
        return new Hash(buf.read(32));
    }

    serialize(buf) {
        buf = buf || new SerialBuffer(this.serializedSize);
        buf.write(this._obj);
        return buf;
    }

    subarray(begin, end) {
        return this._obj.subarray(begin, end);
    }

    get serializedSize() {
        return 32;
    }

    equals(o) {
        return o instanceof Hash && super.equals(o);
    }

    static fromBase64(base64) {
        return new Hash(BufferUtils.fromBase64(base64));
    }

    static fromHex(hex) {
        return new Hash(BufferUtils.fromHex(hex));
    }

    static isHash(o) {
        return o instanceof Hash;
    }
}

if (typeof module !== 'undefined')
    module.exports = Hash;

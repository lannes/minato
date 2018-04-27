class PublicKey {
    constructor(value) {
        if (!(value instanceof Uint8Array))
            throw Error('Invalid type');

        if (value.length !== PublicKey.SERIALIZE_SIZE)
            throw Error('Invalid length');

        this._value = value;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        let value = null;
        if (obj.value !== null)
            value = new Uint8Array(obj.value);

        return new PublicKey(value);
    }

    equals(obj) {
        return obj instanceof PublicKey
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

    static deserialize(buf) {
        const value = buf.read(PublicKey.SERIALIZE_SIZE);
        return new PublicKey(value);
    }

    get serializeSize() {
        return PublicKey.SERIALIZE_SIZE;
    }

    hash() {
        new Hash(KHash.sha256(this.serialize()));
    }

    toAddress() {
        return Address.fromHash(this.hash());
    }

    toPeerId() {
        return new PeerId(this.hash().subarray(0, 16));
    }
}

PublicKey.SERIALIZE_SIZE = 32;

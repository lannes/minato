class BlockHeader {
    constructor(height, prevHash, bodyHash, timestamp, difficulty, nonce) {
        if (!NumberUtils.isUint32(height))
            throw Error('BlockHeader: Malformed height');
        if (!(prevHash instanceof Hash))
            throw Error('BlockHeader: Malformed prevhash');
        if (!(bodyHash instanceof Hash))
            throw Error('BlockHeader: Malformed bodyHash');
        if (!NumberUtils.isUint32(timestamp))
            throw Error('BlockHeader: Malformed timestamp');
        if (!NumberUtils.isUint32(difficulty))
            throw Error('BlockHeader: Malformed difficulty');
        if (!NumberUtils.isUint32(nonce))
            throw Error('BlockHeader: Malformed nonce');

        this._height = height;
        this._prevHash = prevHash;
        this._bodyHash = bodyHash;
        this._timestamp = timestamp;
        this._difficulty = difficulty;
        this._nonce = nonce;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const prevHash = Hash.clone(obj.prevHash);
        const bodyHash = Hash.clone(obj.bodyHash);

        return new BlockHeader(obj.height, prevHash, bodyHash, obj.timestamp, obj.difficulty, obj.nonce);
    }

    equals(obj) {
        return obj instanceof BlockHeader
            && this._height === obj.height
            && this._prevHash.equals(obj.prevHash)
            && this._bodyHash.equals(obj.bodyHash)
            && this._timestamp === obj.timestamp
            && this._difficulty === obj.difficulty
            && this._nonce === obj.nonce;
    }

    toString() {
        return `{`
            + `height: ${this._height},`
            + `prevHash: ${this._prevHash.hex},`
            + `bodyHash: ${this._bodyHash.hex},`
            + `timesteamp: ${this._timestamp}`
            + `difficulty: ${this._difficulty}`
            + `nonce: ${this._nonce}`
            + `}`;
    }

    verifyProofOfWork() {
        return BlockUtils.isProofOfWork(this.hash().value, this._difficulty);
    }

    isImmediateSuccessorOf(prevHeader) {
        if (this.height !== prevHeader.height + 1) {
            return false;
        }

        if (this.timestamp < prevHeader.timestamp) {
            return false;
        }

        const prevHash = prevHeader.hash();
        if (!this.prevHash.equals(prevHash)) {
            return false;
        }

        return true;
    }

    get height() {
        return this._height;
    }

    get prevHash() {
        return this._prevHash;
    }

    get bodyHash() {
        return this._bodyHash;
    }

    get timestamp() {
        return this._timestamp;
    }

    get difficulty() {
        return this._difficulty;
    }

    get nonce() {
        return this._nonce;
    }

    set nonce(n) {
        this._nonce = n;
    }

    hash() {
        if (!this._hash) {
            this._hash = new Hash(KHash.sha256(this.serialize()));
        }

        return this._hash;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        buf.writeUint32(this._height);
        this._prevHash.serialize(buf);
        this._bodyHash.serialize(buf);
        buf.writeUint32(this._timestamp);
        buf.writeUint32(this._difficulty);
        buf.writeUint32(this._nonce);

        return buf;
    }

    static deserialize(buf) {
        const height = buf.readUint32();
        const prevHash = Hash.deserialize(buf);
        const bodyHash = Hash.deserialize(buf);
        const timestamp = buf.readUint32();
        const difficulty = buf.readUint32();
        const nonce = buf.readUint32();

        return new BlockHeader(height, prevHash, bodyHash, timestamp, difficulty, nonce);
    }

    get serializeSize() {
        return 4 /* height */
            + this._prevHash.serializeSize /* prevHash */
            + this._bodyHash.serializeSize /* bodyHash */
            + 4 /* timestamp */
            + 4 /* difficulty */
            + 4 /* nonce */;
    }
}

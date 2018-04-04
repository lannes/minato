if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/buffer');
    global.ArrayUtils = require('../../util/ArrayUtils');
    global.Hash = require('../nodejs/crypto/Hash');
}

class BlockHeader {
    constructor(height, prevHash, bodyHash, timestamp, difficulty, nonce) {
        if (typeof height !== 'number')
            throw Error('Invalid height');
        if (prevHash && !(prevHash instanceof Uint8Array))
            throw Error('Invalid prevhash');
        if (!(bodyHash instanceof Uint8Array))
            throw Error('Invalid bodyHash');
        if (typeof timestamp !== 'number')
            throw Error('Invalid timestamp');
        if (typeof difficulty !== 'number')
            throw Error('Invalid difficulty');
        if (typeof nonce !== 'number')
            throw Error('Invalid nonce');

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

        const previousHash = obj.prevHash;
        const bodyHash = obj.bodyHash;

        return new BlockHeader(obj.height, previousHash, bodyHash, obj.timestamp, obj.difficulty, obj.nonce);
    }

    equals(obj) {
        return obj instanceof BlockHeader
            && this._height === obj.height
            && ArrayUtils.equals(this._prevHash, obj.prevHash)
            && ArrayUtils.equals(this._bodyHash, obj.bodyHash)
            && this._timestamp === obj.timestamp
            && this._difficulty === obj.difficulty
            && this._nonce === obj.nonce;
    }

    toString() {
        return `{`
            + `height: ${this._height},`
            + `prevHash: ${ArrayUtils.toHex(this._prevHash)},`
            + `bodyHash: ${ArrayUtils.toHex(this._bodyHash)},`
            + `timesteamp: ${this._timestamp}`
            + `difficulty: ${this._difficulty}`
            + `nonce: ${this._nonce}`
            + `}`;
    }

    verifyProofOfWork() {
        return BlockUtils.isProofOfWork(this.hash(), this._difficulty);
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
            this._hash = KHash.sha256(this.serialize());
        }

        return this._hash;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        buf.writeUint32(this._height);

        if (this._prevHash) {
            buf.writeUint8(1);
            buf.write(this._prevHash);
        } else {
            buf.writeUint8(0);
        }

        buf.write(this._bodyHash);
        buf.writeUint32(this._timestamp);
        buf.writeUint32(this._difficulty);
        buf.writeUint32(this._nonce);

        return buf;
    }

    static deserialize(buf) {
        const height = buf.readUint32();

        let prevHash = null;
        const prevHashPresent = buf.readUint8();
        if (prevHashPresent)
            prevHash = buf.read(32);

        const bodyHash = buf.read(32);
        const timestamp = buf.readUint32();
        const difficulty = buf.readUint32();
        const nonce = buf.readUint32();

        return new BlockHeader(height, prevHash, bodyHash, timestamp, difficulty, nonce);
    }

    get serializeSize() {
        return 4 /* height */
            + 1 /* prevHashPresent */
            + (this._prevHash ? 32 : 0) /* prevHash */
            + 32 /* bodyHash */
            + 4 /* timestamp */
            + 4 /* difficulty */
            + 4 /* nonce */;
    }
}

if (typeof module !== 'undefined')
    module.exports = BlockHeader;

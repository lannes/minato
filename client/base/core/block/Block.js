if (typeof require !== 'undefined') {
    global.BlockHeader = require('./BlockHeader');
    global.BlockBody = require('./BlockBody');
    global.KBuffer = require('../../utils/Buffer');
}

class Block {
    constructor(header, body) {
        if (!(header instanceof BlockHeader))
            throw Error('Block: Malformed header');
        if (!(body instanceof BlockBody))
            throw Error('Block: Malformed body');

        this._header = header;
        this._body = body;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        return new Block(BlockHeader.clone(obj.header), BlockBody.clone(obj.body));
    }

    equals(obj) {
        return obj instanceof Block
            && this._header.equals(obj.header)
            && (this._body ? this._body.equals(obj.body) : !obj.body);
    }

    get header() {
        return this._header;
    }

    get body() {
        return this._body;
    }

    get height() {
        return this._header.height;
    }

    get prevHash() {
        return this._header.prevHash;
    }

    get bodyHash() {
        return this._header.bodyHash;
    }

    get timestamp() {
        return this._header.timestamp;
    }

    get difficulty() {
        return this._header.difficulty;
    }

    get nonce() {
        return this._header.nonce;
    }

    get transactions() {
        return this._body.transactions;
    }

    get transactionCount() {
        return this._body.transactionCount;
    }

    hash() {
        return this._header.hash();
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        this._header.serialize(buf);
        this._body.serialize(buf);

        return buf;
    }

    static deserialize(buf) {
        const header = BlockHeader.deserialize(buf);
        const body = BlockBody.deserialize(buf);
        return new Block(header, body);
    }

    get serializeSize() {
        return this._header.serializeSize + this._body.serializeSize;
    }

    _verifyBody() {
        if (!this._body.verify())
            return false;

        const bodyHash = this._body.hash();
        if (!this._header.bodyHash.equals(bodyHash)) {
            return false;
        }

        return true;
    }

    _verify(timeNow) {
        if (this.timestamp >= timeNow + 60)
            return false;

        if (!this._header.verifyProofOfWork())
            return false;

        if (!this._verifyBody())
            return false;

        return true;
    }

    verify() {
        const timeNow = Math.round(new Date().getTime() / 1000);
        if (!this._verify(timeNow))
            return false;

        return true;
    }

    isImmediateSuccessorOf(prevBlock) {
        if (!this._header.isImmediateSuccessorOf(prevBlock.header))
            return false;

        return true;
    }
}


if (typeof module !== 'undefined')
    module.exports = Block;

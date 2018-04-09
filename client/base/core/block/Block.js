if (typeof require !== 'undefined') {
    global.Hash = require('../nodejs/crypto/Hash');
    global.Transaction = require('../transaction/Transaction');
    global.BlockHeader = require('./BlockHeader');
    global.BlockBody = require('./BlockBody');
    global.KBuffer = require('../../util/Buffer');
}

class Block {
    constructor(header, body) {
        if (!(header instanceof BlockHeader))
            throw Error('Invalid header');
        if (!(body instanceof BlockBody))
            throw Error('Invalid body');

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

    verify() {
        if (!this._header.verifyProofOfWork())
            return false;

        if (!this._verifyBody())
            return false;

        return true;
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

    static verifyTimestamp(newBlock, prevBlock) {
        return (prevBlock.timestamp - 60 < newBlock.timestamp)
            && newBlock.timestamp - 60 < getCurrentTimestamp();
    }

    static verifyNewBlock(newBlock, prevBlock) {
        if (newBlock.height - 1 !== prevBlock.height) {
            return false;
        }

        if (!newBlock.prevHash.equals(prevBlock.hash())) {
            return false;
        }

        if (!Block.verifyTimestamp(newBlock, prevBlock)) {
            return false;
        }

        if (!newBlock.verify()) {
            return false;
        }

        return true;
    }
}


if (typeof module !== 'undefined')
    module.exports = Block;

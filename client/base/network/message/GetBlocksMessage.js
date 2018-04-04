if (typeof require !== 'undefined') {
    global.Message = require('./Message');
    global.KBuffer = require('../../util/Buffer');
    global.Block = require('../../core/block/Block');
}

class GetBlocksMessage extends Message {
    constructor(count) {
        super(Message.Type.GET_BLOCKS);
        this._count = count;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);
        buf.writeUint16(this._count);
        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);
        const count = buf.readUint16();
        return new GetBlocksMessage(count);
    }

    get serializeSize() {
        return super.serializeSize
            + 2 /* count */;
    }

    get count() {
        return this._count;
    }
}

if (typeof module !== 'undefined')
    module.exports = GetBlocksMessage;
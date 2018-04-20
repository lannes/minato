if (typeof require !== 'undefined') {
    global.Message = require('./Message');
    global.KBuffer = require('../../utils/Buffer');
    global.Block = require('../../core/block/Block');
}

class BlocksMessage extends Message {
    constructor(blocks) {
        super(Message.Type.BLOCKS);

        this._blocks = blocks;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);
        buf.writeUint16(this._blocks.length);

        for (const block of this._blocks) {
            block.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);

        const size = buf.readUint16();
        const blocks = [];
        for (let i = 0; i < size; i++) {
            blocks.push(Block.deserialize(buf));
        }

        return new BlocksMessage(blocks);
    }

    get serializeSize() {
        return super.serializeSize
            + 2 /* size of blocks */
            + this._blocks.reduce((sum, block) => sum + block.serializeSize, 0);
    }

    get blocks() {
        return this._blocks;
    }
}

if (typeof module !== 'undefined')
    module.exports = BlocksMessage;
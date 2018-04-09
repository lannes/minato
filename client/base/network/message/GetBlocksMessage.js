if (typeof require !== 'undefined') {
    global.Message = require('./Message');
    global.KBuffer = require('../../util/Buffer');
    global.Block = require('../../core/block/Block');
}

class GetBlocksMessage extends Message {
    constructor(locators) {
        super(Message.Type.GET_BLOCKS);

        this._locators = locators;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);

        buf.writeUint16(this._locators.length);
        for (const locator of this._locators) {
            locator.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);
        const count = buf.readUint16();

        const locators = [];
        for (let i = 0; i < count; i++) {
            locators.push(Hash.deserialize(buf));
        }

        return new GetBlocksMessage(locators);
    }

    get serializeSize() {
        let size = super.serializeSize
            + 2 /* count */;

        for (const locator of this._locators) {
            size += locator.serializeSize;
        }

        return size;
    }

    get locators() {
        return this._locators;
    }
}

if (typeof module !== 'undefined')
    module.exports = GetBlocksMessage;
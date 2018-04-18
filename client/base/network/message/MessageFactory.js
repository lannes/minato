if (typeof require !== 'undefined') {
    global.Message = require('./Message');
    global.GetHeadMessage = require('./GetHeadMessage');
    global.GetBlocksMessage = require('./GetBlocksMessage');
    global.BlocksMessage = require('./BlocksMessage');
    global.GetPoolMessage = require('./GetPoolMessage');
    global.PoolMessage = require('./PoolMessage');
}

class MessageFactory {
    static peekType(buf) {
        return Message.peekType(buf);
    }

    static parse(buf) {
        const type = Message.peekType(buf);
        const clazz = MessageFactory.CLASSES[type];
        if (!clazz || !clazz.deserialize)
            throw Error(`Invalid message type: ${type}`);
        return clazz.deserialize(buf);
    }
}

MessageFactory.CLASSES = {};
MessageFactory.CLASSES[Message.Type.GET_HEAD] = GetHeadMessage;
MessageFactory.CLASSES[Message.Type.GET_BLOCKS] = GetBlocksMessage;
MessageFactory.CLASSES[Message.Type.BLOCKS] = BlocksMessage;
MessageFactory.CLASSES[Message.Type.GET_POOL] = GetPoolMessage;
MessageFactory.CLASSES[Message.Type.POOL] = PoolMessage;

if (typeof module !== 'undefined')
    module.exports = MessageFactory;

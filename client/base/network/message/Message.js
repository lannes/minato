class Message {
    constructor(type) {
        if (!NumberUtils.isUint8(type))
            throw Error('Message: Malformed type');
        this._type = type;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        if (buf.writePos !== 0)
            throw Error('Message.serialize() requires buf.writePos == 0');

        buf.writeUint8(this._type);
        buf.writeUint32(this.serializeSize);
        return buf;
    }

    static deserialize(buf) {
        if (buf.readPos !== 0)
            throw Error('Message.deserialize() requires buf.readPos == 0');

        const type = buf.readUint8();
        buf.readUint32();
        return new Message(type);
    }

    get serializeSize() {
        return 1 /* type */
            + 4 /* length */;
    }

    static peekType(buf) {
        const pos = buf.readPos;

        const type = buf.readUint8();

        buf.readPos = pos;

        return type;
    }

    static peekLength(buf) {
        const pos = buf.readPos;

        buf.readUint8();
        const length = buf.readUint32();

        buf.readPos = pos;

        return length;
    }

    get type() {
        return this._type;
    }
}

Message.Type = {
    SIGNAL: 0,
    GET_HEAD: 1,
    GET_BLOCKS: 2,
    BLOCKS: 3,
    GET_POOL: 4,
    POOL: 5
};

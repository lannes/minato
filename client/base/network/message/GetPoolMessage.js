class GetPoolMessage extends Message {
    constructor() {
        super(Message.Type.GET_POOL);
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);
        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);
        return new GetPoolMessage();
    }

    get serializeSize() {
        return super.serializeSize;
    }
}

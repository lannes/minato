class GetHeadMessage extends Message {
    constructor() {
        super(Message.Type.GET_HEAD);
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        super.serialize(buf);
        return buf;
    }

    static deserialize(buf) {
        Message.deserialize(buf);
        return new GetHeadMessage();
    }

    get serializeSize() {
        return super.serializeSize;
    }
}

class HeaderChain {
    constructor(heades) {
        if (!headers
            || !Array.isArray(headers)
            || !NumberUtils.isUint16(headers.length)
            || headers.some(h => !(h instanceof BlockHeader)))
            throw Error('HeaderChain: Malformed headers');

        this._headers = headers;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        buf.writeUint16(this._headers.length);
        for (const header of this._headers) {
            header.serialize(buf);
        }

        return buf;
    }

    static deserialize(buf) {
        const length = buf.readUint16();

        const headers = [];
        for (let i = 0; i < length; i++) {
            headers.push(BlockHeader.deserialize(buf));
        }

        return new HeaderChain(headers);
    }

    get serializeSize() {
        return 2 /* length */
            + this._headers.reduce((sum, header) => sum + header.serializeSize, 0);
    }

    verify() {
        for (let i = this._headers.length - 1; i >= 1; i--) {
            if (!this._headers[i].isImmediateSuccessorOf(this._headers[i - 1])) {
                return false;
            }
        }

        return true;
    }

    get length() {
        return this._headers.length;
    }

    get headers() {
        return this._headers;
    }

    get head() {
        return this._headers[this.length - 1];
    }

    get tail() {
        return this._headers[0];
    }

    totalDifficulty() {
        return this._headers.reduce((sum, header) => sum + Math.pow(2, header.difficulty), 0);
    }
}

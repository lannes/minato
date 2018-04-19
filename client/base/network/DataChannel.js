if (typeof require !== 'undefined') {
    global.Observable = require('../util/Observable');
    global.KBuffer = require('../util/Buffer');
    global.NumberUtils = require('../util/NumberUtils');
    global.Message = require('./message/Message');
}

class DataChannel extends Observable {
    constructor() {
        super();

        this._sendingTag = 0;
        this._receivingTag = -1;
        this._buffer = null;
    }

    close() {
        throw Error('Not implemented');
    }

    _onClose() {
        this.notify('close');
    }

    _error(msg) {
        this.notify('error', msg);
        this.close();
    }

    _onMessage(msg) {
        try {
            if (this.readyState !== DataChannel.ReadyState.OPEN) {
                return;
            }

            const buffer = new KBuffer(msg);
            if (buffer.byteLength === 0) {
                return;
            }

            if (buffer.byteLength > DataChannel.CHUNK_SIZE_MAX) {
                console.log('Received chunk larger than maximum chunk size, discarding');
                return;
            }

            const tag = buffer.readUint8();

            const effectiveChunkLength = buffer.byteLength - buffer.readPos;
            const chunk = buffer.read(effectiveChunkLength);

            if (this._buffer === null && tag === (this._receivingTag + 1) % NumberUtils.UINT8_MAX) {
                const chunkBuffer = new KBuffer(chunk);
                const messageSize = Message.peekLength(chunkBuffer);

                if (messageSize > DataChannel.MESSAGE_SIZE_MAX) {
                    console.log(`Received message with excessive message size ${messageSize} > ${DataChannel.MESSAGE_SIZE_MAX}`);
                    return;
                }

                this._buffer = new KBuffer(messageSize);
                this._receivingTag = tag;
                this._msgType = Message.peekType(chunkBuffer);
            }

            if (this._buffer === null) {
                console.log(`Message does not start with next tag ${this._receivingTag + 1} (got ${tag} instead), but buffer is null`);
                return;
            }

            if (tag !== this._receivingTag) {
                console.log(`Received message with wrong message tag ${tag}, expected ${this._receivingTag}`);
                return;
            }

            let remainingBytes = this._buffer.byteLength - this._buffer.writePos;

            if (effectiveChunkLength > remainingBytes) {
                console.log('Received chunk larger than remaining bytes to read, discarding');
                return;
            }

            this._buffer.write(chunk);
            remainingBytes -= effectiveChunkLength;

            if (remainingBytes === 0) {
                const msg = this._buffer.buffer;
                this._buffer = null;

                this.notify('message', msg);
            }
        } catch (e) {
            this._error(`DataChannel: Error occurred while parsing incoming message, ${e.message}`);
        }
    }

    send(msg) {
        const tag = this._sendingTag;
        this._sendingTag = (this._sendingTag + 1) % NumberUtils.UINT8_MAX;

        let remaining = msg.byteLength;
        let chunk = null;

        while (remaining > 0) {
            let buffer = null;

            if (remaining + 1 /* tag */ >= DataChannel.CHUNK_SIZE_MAX) {
                buffer = new KBuffer(DataChannel.CHUNK_SIZE_MAX);
                buffer.writeUint8(tag);
                chunk = new Uint8Array(msg.buffer, msg.byteLength - remaining, DataChannel.CHUNK_SIZE_MAX - 1 /* tag */);
            } else {
                buffer = new KBuffer(remaining + 1 /* tag */);
                buffer.writeUint8(tag);
                chunk = new Uint8Array(msg.buffer, msg.byteLength - remaining, remaining);
            }

            buffer.write(chunk);
            this._sendChunk(buffer);
            remaining -= chunk.byteLength;
        }
    }

    _sendChunk(msg) {
        throw Error('Not implemented');
    }

    get readyState() {
        throw Error('Not implemented');
    }

    
}

DataChannel.CHUNK_SIZE_MAX = 16 * 1024;
DataChannel.MESSAGE_SIZE_MAX = 10 * 1024 * 1024; // 10 mb
DataChannel.CHUNK_TIMEOUT = 1000 * 5; // 5 seconds
DataChannel.MESSAGE_TIMEOUT = (DataChannel.MESSAGE_SIZE_MAX / DataChannel.CHUNK_SIZE_MAX) * DataChannel.CHUNK_TIMEOUT;

DataChannel.ReadyState = {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
};

DataChannel.ReadyState.fromString = function (str) {
    switch (str) {
        case 'connecting':
            return DataChannel.ReadyState.CONNECTING;
        case 'open':
            return DataChannel.ReadyState.OPEN;
        case 'closing':
            return DataChannel.ReadyState.CLOSING;
        case 'closed':
            return DataChannel.ReadyState.CLOSED;
        default:
            throw Error('Invalid string');
    }
};

if (typeof module !== 'undefined')
    module.exports = DataChannel;

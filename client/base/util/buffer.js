if (typeof require !== 'undefined') {
    global.NumberUtils = require('./NumberUtils');
    global.ArrayUtils = require('./ArrayUtils');
}

class KBuffer extends Uint8Array {
    constructor(arrayOrLength) {
        super(arrayOrLength);
        this._view = new DataView(this.buffer);
        this._readPos = 0;
        this._writePos = 0;
    }

    equals(obj) {
        return obj instanceof KBuffer
            && this.length === obj.length
            && this.every((value, i) => value === obj[i]);
    }

    subarray(start, end) {
        return ArrayUtils.subarray(this, start, end);
    }

    get readPos() {
        return this._readPos;
    }

    set readPos(number) {
        if (number < 0 || number > this.byteLength)
            throw `Invalid readPos ${number}`;
        this._readPos = number;
    }

    get writePos() {
        return this._writePos;
    }

    set writePos(number) {
        if (number < 0 || number > this.byteLength)
            throw `Invalid writePos ${number}`;

        this._writePos = number;
    }

    reset() {
        this._readPos = 0;
        this._writePos = 0;
    }

    read(length) {
        const array = this.subarray(this._readPos, this._readPos + length);
        this._readPos += length;
        return array;
    }

    write(array) {
        this.set(array, this._writePos);
        this._writePos += array.byteLength;
    }

    readUint8() {
        return this._view.getUint8(this._readPos++);
    }

    writeUint8(number) {
        this._view.setUint8(this._writePos++, number);
    }

    readUint16() {
        const number = this._view.getUint16(this._readPos);
        this._readPos += 2;
        return number;
    }

    writeUint16(number) {
        this._view.setUint16(this._writePos, number);
        this._writePos += 2;
    }

    readUint32() {
        const number = this._view.getUint32(this._readPos);
        this._readPos += 4;
        return number;
    }

    writeUint32(number) {
        this._view.setUint32(this._writePos, number);
        this._writePos += 4;
    }

    readUint64() {
        const number = this._view.getFloat64(this._readPos);
        if (!NumberUtils.isUint64(number))
            throw new Error('Malformed value');
        this._readPos += 8;
        return number;
    }

    writeUint64(number) {
        if (!NumberUtils.isUint64(number)) throw new Error('Malformed value');
        this._view.setFloat64(this._writePos, number);
        this._writePos += 8;
    }

    readFloat64() {
        const number = this._view.getFloat64(this._readPos);
        this._readPos += 8;
        return number;
    }

    writeFloat64(number) {
        this._view.setFloat64(this._writePos, number);
        this._writePos += 8;
    }
}

if (typeof module !== 'undefined')
    module.exports = KBuffer;
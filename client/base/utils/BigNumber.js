/**
 * Version: 0.2.0
 * Create By: dongnh@vtc.vn
 */

class BigNumber {
    constructor(bn) {
        this._remainder = 0;
        this._float = .0;
        this._sign = 1;
        if (!bn || bn === 0) {
            this._buf = [0];
            return;
        }

        if (typeof bn === 'number') {
            if (bn < 0) {
                this._sign = -1;
                bn = -bn;
            }

            if (Number.isInteger(bn)) {
                const buf = BigNumber._base10IntToBase2(bn);
                this._buf = BigNumber._compress(buf);
                return;
            }

            const n = bn - bn % 1;
            const float = bn - n;

            const buf = BigNumber._base10IntToBase2(n);
            this._buf = BigNumber._compress(buf);
            this._float = float;

            return;
        }

        if (typeof bn === 'string') {
            if (bn[0] === '-') {
                this._sign = -1;
                bn = bn.substr(1);
            }

            const buf = BigNumber._base10StringToBase2(bn);
            this._buf = BigNumber._compress(buf);
            return;
        }

        if (bn instanceof Array) {
            if (bn.length === 0)
                throw Error('Malformed length');

            this._buf = bn;
            return;
        }

        if (bn instanceof BigNumber) {
            if (bn.buf === null)
                throw Error('Malformed value');
            if (!(bn.buf instanceof Array))
                throw Error('Malformed type');
            if (bn.buf.length === 0)
                throw Error('Malformed length');

            for (let i = 0; i < bn.buf.length; i++)
                this._buf[i] = bn.buf[i];

            this._sign = bn.sign;
            this._float = bn.float;
            this._remainder = bn.remainder;
            return;
        }

        this._buf = [0];
    }

    static clone(obj) {
        if (!obj)
            return obj;

        let buf = [];
        for (let i = 0; i < obj.buf.length; i++)
            buf[i] = obj.buf[i];

        let result = new BigNumber(buf);

        result._sign = this._sign;
        result._float = this._float;
        result._remainder = this._remainder;

        return result;
    }

    toString() {
        const binaryBuf = BigNumber._decompress(this._buf);
        let buf = [0];

        for (let i = binaryBuf.length - 1; i >= 0; i--) {
            buf[0] += binaryBuf[i];

            if (i === 0)
                break;

            let carry = 0;
            for (let j = 0; j < buf.length; j++) {
                const product = buf[j] * 2 + carry;
                buf[j] = product % 10;
                carry = Math.floor(product / 10);
            }

            if (carry > 0)
                buf.push(carry);
        }

        let s = '';
        for (let i = buf.length - 1; i >= 0; i--) {
            s += buf[i].toString();
        }

        if (this._float > 0)
            s += this._float.toString().substr(1);

        if (this._sign === -1)
            s = '-' + s;

        return s;
    }

    equals(obj) {
        return obj instanceof BigNumber
            && this._buf.length === obj.buf.length
            && this._buf.every((value, i) => value === obj.buf[i]);
    }

    /**
     * Compare two buffers
     * @param {Array<Number>} a buffer of BigNumber
     * @param {Array<Number>} b buffer of BigNumber
     * @return {Number} result
     */
    static _compare(a, b) {
        if (a.length > b.length)
            return 1;
        if (a.length < b.length)
            return -1;

        for (let i = a.length - 1; i >= 0; i--) {
            if (a[i] > b[i])
                return 1;
            if (a[i] < b[i])
                return -1;
        }

        return 0;
    }

    /**
     * Compare with an another BigNumber
     * @param {BigNumber} obj
     * @return {Number} result
     */
    compare(obj) {
        if (this._sign > obj.sign)
            return 1;

        if (this._sign < obj.sign)
            return -1;

        let result = BigNumber._compare(this._buf, obj.buf);
        if (result === 0) {
            if (this._float > obj.float)
                result = 1;
            else if (this._float < obj.float)
                result = - 1;
        }

        if (this._sign === -1 && obj.sign === -1)
            result = - result;

        return result;
    }

    static _isZero(buf) {
        return buf.length === 1 && buf[0] === 0;
    }

    get isZero() {
        return BigNumber._isZero(this._buf);
    }

    static _isOne(buf) {
        return buf.length === 1 && buf[0] === 1;
    }

    get isOne() {
        return BigNumber._isOne(this._buf);
    }

    get sign() {
        return this._sign;
    }

    get buf() {
        return this._buf;
    }

    get remainder() {
        return this._remainder;
    }

    get float() {
        return this._float;
    }

    get isInteger() {
        return this._float === 0;
    }

    abs() {
        let result = BigNumber.clone(this);
        result._sign = 1;
        return result;
    }

    static max(a, b) {
        if (a.compare(b) >= 0)
            return a;

        return b;
    }

    toByteArray() {
        let arr = new Uint8Array();

        return arr;
    }

    static _fromByteArray(arr) {
        const r = arr.length % 3;

        let buf = [];
        for (let i = arr.length - 1; i >= 2 + r; i -= 3) {
            buf.push(arr[i - 2] << 16 | arr[i - 1] << 8 | arr[i]);
        }

        if (r === 2)
            buf.push(arr[0] << 8 | arr[1]);
        if (r === 1)
            buf.push(arr[0]);

        return buf;
    }

    static fromByteArray(arr) {
        if (!(arr instanceof Uint8Array))
            throw Error('Not implemented');

        const buf = BigNumber._fromByteArray(arr);
        return new BigNumber(buf);
    }

    static fromHex(hex) {
        let sign = 1;
        let pos = 0;

        if (hex[0] === '-') {
            pos++;
            sign = -1;
        }

        if (hex.length < 3 + pos)
            throw Error('Malformed length');

        if (hex[pos] !== '0' || hex[pos + 1] !== 'x')
            throw Error('Malformed format');

        pos += 2;
        while (hex[pos] === '0')
            pos++;

        let binaryBuf = [];
        for (let i = hex.length - 1; i >= pos; i--) {
            for (let j = 3; j >= 0; j--)
                binaryBuf.push(BigNumber.HEX_BIN[hex[i]][j]);
        }

        const buf = BigNumber._compress(binaryBuf);

        let result = new BigNumber(buf);
        result._sign = sign;
        return result;
    }

    get bitLength() {
        return BigNumber._bitLength(this._buf);
    }

    /**
     * Count number of bits in a compressed buffer
     * @param {Array<Number>} buf a compressed buffer
     * @return {Number} number of bits
     */
    static _bitLength(buf) {
        let count = 0;
        let n = buf[buf.length - 1];

        while (n) {
            count++;
            n >>= 1;
        }

        if (buf.length === 1)
            return count;

        return (buf.length - 1) * BigNumber.EXPONENT + count;
    }

    /**
     * Compress a binary buffer to a smaller buffer
     * @param {Array<Number>} buf binary buffer
     * @return {Array<Number>} a compressed buffer
     */
    static _compress(buf) {
        if (buf.length === 0)
            throw Error('Malformed length');

        if (BigNumber._isZero(buf))
            return [0];

        let result = [];
        let size = Math.floor(buf.length / BigNumber.EXPONENT);
        for (let i = 0; i < size; i++) {
            let n = 0;
            for (let j = BigNumber.EXPONENT - 1; j >= 0; j--) {
                n |= buf[i * BigNumber.EXPONENT + j] << j;
            }

            result.push(n);
        }

        const r = buf.length % BigNumber.EXPONENT;
        if (r > 0) {
            let n = 0;
            for (let j = r - 1; j >= 0; j--) {
                n |= buf[size * BigNumber.EXPONENT + j] << j;
            }

            result.push(n);
        }

        return result;
    }

    /**
     * Decompress a buffer
     * @param {Array<Number>} buf a buffer compressed
     * @return a binary buffer
     */
    static _decompress(buf) {
        if (buf.length === 0)
            throw Error('Malformed length');

        if (BigNumber._isZero(buf))
            return [0];

        let result = [];
        let i = 0;
        while (i < buf.length) {
            let n = buf[i];
            let count = 0;

            while (n > 0) {
                result.push(n & 1);
                n >>= 1;
                count++;
            }

            i++;
            if (i === buf.length)
                break;

            while (count < BigNumber.EXPONENT) {
                result.push(0);
                count++;
            }
        }

        return result;
    }

    _divBase(d) {
        let Q = [];
        let n = 0;
        let i = this._buf.length - 1;

        while (n < d && i >= 0) {
            n = (n * BigNumber.BASE) + this._buf[i--];
        }

        if (i < 0) {
            Q.push(Math.floor(n / d));
            return { Q: Q, R: n % d };
        }

        while (true) {
            Q.push(Math.floor(n / d));
            if (i < 0)
                break;

            n = ((n % d) * BigNumber.BASE) + this._buf[i--];
        }

        return { Q: Q.reverse(), R: n % d };
    }

    static _divBaseString(s, d, base) {
        let Q = '';
        let n = 0;
        let i = 0;

        while (n < d && i < s.length) {
            n = n * base + BigNumber.LOOKUP_CHARS[s[i++]];
        }

        if (i === s.length) {
            Q += Math.floor(n / d);
            return { Q: Q, R: n % d };
        }

        while (true) {
            Q += Math.floor(n / d);
            if (i > s.length - 1)
                break;

            n = (n % d) * base + BigNumber.LOOKUP_CHARS[s[i++]];
        }

        return { Q: Q, R: n % d };
    }

    /**
     * Convert a string from source base to target base
     * @param {String} s string
     * @return {Array<Number>} a buffer not compress
     */
    static _base10StringToBase2(s) {
        let buf = [];

        do {
            const r = BigNumber._divBaseString(s, 2, 10);
            buf.push(r.R);
            s = r.Q;
        } while (s !== '0');

        return buf;
    }

    /**
     * Convert a number from decimal to another base
     * @param {Number} n decimal number
     * @return {Array<Number>} a buffer not compress
     */
    static _base10IntToBase2(n) {
        if (n === 0)
            return [0];

        let buf = [];

        while (n > 0) {
            buf.push(n % 2);
            n = Math.floor(n / 2);
        }

        return buf;
    }

    /**
     * Convert BigNumber to binary string
     * @return {String} binary string
     */
    get bin() {
        const buf = BigNumber._decompress(this._buf);

        let s = '';
        for (let i = buf.length - 1; i >= 0; i--) {
            s += buf[i];
        }

        if (this._sign === -1)
            s = '-' + s;

        return s;
    }

    /**
     * Convert BigNumber to hexa string
     * @return {String} hexa string
     */
    get hex() {
        let bin = this.bin;
        if (bin[0] === '-')
            bin = bin.substr(1);

        let size = Math.floor(bin.length / 4);
        const r = bin.length % 4;

        if (r > 0) {
            size++;
            while (bin.length < size * 4) {
                bin = '0' + bin;
            }
        }

        let s = '';
        for (let i = 0; i < size; i++) {
            s += BigNumber.BIN_HEX[bin.substr(i * 4, 4)];
        }

        if (this._sign === -1)
            s = '-' + s;

        return s;
    }

    add(obj) {
        let bn = null;

        if (typeof obj === 'number') {
            bn = new BigNumber(obj);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        let sign = 1;
        if (this._sign + bn.sign === 0) {
            let A = this;
            let B = bn;

            if ((BigNumber._compare(this._buf, bn.buf) > 0) ||
                (BigNumber._compare(this._buf, bn.buf) === 0 && this._float > bn.float)) {
                sign = this._sign;
            } else {
                sign = bn.sign;
                A = bn;
                B = this;
            }

            let buf = BigNumber._sub(A._buf, B._buf, BigNumber.BASE);
            let float = A._float - B._float;
            if (float < 0) {
                buf = BigNumber._sub(buf, [1], BigNumber.BASE);
                float = 1 + float;
            }

            let result = new BigNumber(buf);
            result._sign = sign;
            result._float = float;
            return result;
        }

        if (this._sign === -1 && bn.sign === -1) {
            sign = -1;
        }

        let buf = BigNumber._add(this._buf, bn.buf);
        let float = this._float + bn.float;

        if (float >= 1) {
            buf = BigNumber._add(buf, [1]);
            float = float - 1;
        }

        let result = new BigNumber(buf);
        result._sign = sign;
        result._float = float;
        return result;
    }

    static _add(aBuf, bBuf) {
        let buf = [];
        let carry = 0;
        const length = Math.max(aBuf.length, bBuf.length);

        let i = 0;
        while (i < length || carry > 0) {
            const sum = (aBuf[i] || 0) + (bBuf[i] || 0) + carry;
            carry = Math.floor(sum / BigNumber.BASE);
            //carry = sum >> BigNumber.EXPONENT;
            buf[i] = sum % BigNumber.BASE;
            //buf[i] = sum & (BigNumber.BASE - 1);
            i++;
        }

        return buf;
    }

    sub(obj) {
        let bn = null;

        if (typeof obj === 'number') {
            bn = new BigNumber(obj);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        const sign = this.compare(bn) >= 0 ? 1 : -1;

        if (this._sign + bn.sign === 0) {
            let buf = BigNumber._add(this._buf, bn.buf);
            let float = this._float + bn.float;

            if (float >= 1) {
                buf = BigNumber._add(buf, [1]);
                float = float - 1;
            }

            let result = new BigNumber(buf);
            result._sign = sign;
            result._float = float;
            return result;
        }

        let A = this;
        let B = bn;
        if ((BigNumber._compare(this._buf, bn._buf) < 0) ||
            (BigNumber._compare(this._buf, bn._buf) === 0 && this._float < bn.float)) {
            A = bn;
            B = this;
        }

        let buf = BigNumber._sub(A._buf, B._buf, BigNumber.BASE);
        let float = A._float - B._float;
        if (float < 0) {
            buf = BigNumber._sub(buf, [1], BigNumber.BASE);
            float = 1 + float;
        }

        let result = new BigNumber(buf);
        result._sign = sign;
        result._float = float;
        return result;
    }

    /**
     * Substract two BigNumber
     * @param {Array<Number>} aBuf a compressed buffer
     * @param {Array<Number>} bBuf a compressed buffer
     * @param {Number} base 
     */
    static _sub(aBuf, bBuf, base) {
        let buf = [];
        let carry = 0;

        for (let i = 0; i < aBuf.length; i++) {
            let difference = aBuf[i] - (bBuf[i] || 0) - carry;
            if (difference < 0) {
                difference += base;
                carry = 1;
            } else
                carry = 0;

            buf[i] = difference;
        }

        let pos = buf.length - 1;
        while (buf[pos] === 0)
            pos--;

        if (pos < buf.length - 1)
            buf = buf.slice(0, pos - (buf.length - 1));

        if (buf.length === 0)
            buf.push(0);

        return buf;
    }

    mul(obj) {
        let bn = null;

        if (typeof obj === 'number') {
            bn = new BigNumber(obj);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        if (this.isZero || bn.isZero) {
            return BigNumber.ZERO;
        }

        const buf = BigNumber._mul(this._buf, bn.buf);
        let result = new BigNumber(buf);
        result._sign = this._sign * bn.sign;
        return result;
    }

    static _mul(aBuf, bBuf) {
        let buf = [];

        for (let i = 0; i < aBuf.length + bBuf.length; i++)
            buf.push(0);

        for (let ib = 0; ib < bBuf.length; ib++) {
            let carry = 0;
            for (let ia = 0; ia < aBuf.length; ia++) {
                buf[ia + ib] += carry + (aBuf[ia] * bBuf[ib]);
                carry = Math.floor(buf[ia + ib] / BigNumber.BASE);
                //carry = buf[ia + ib] >> BigNumber.EXPONENT;
                buf[ia + ib] %= BigNumber.BASE;
                //buf[ia + ib] &= (BigNumber.BASE - 1);
            }

            buf[ib + aBuf.length] += carry;
        }

        if (buf[bBuf.length + aBuf.length - 1] === 0)
            buf = buf.slice(0, -1);

        return buf;
    }

    mod(n) {
        if (n instanceof BigNumber) {
            const bn = this.divMod(n);
            return bn.remainder;
        }

        if (!NumberUtils.isUint32(n))
            throw Error('Not implemented');

        let result = 0;

        for (let i = this._buf.length - 1; i >= 0; i--) {
            result = (result * BigNumber.BASE + this._buf[i]) % n;
        }

        return result;
    }

    divMod(d) {
        if (d === 0)
            throw Error('Division by zero');

        if (d === 1)
            return BigNumber.clone(this);

        if (this.isZero)
            return BigNumber.ZERO;

        if (Number.isInteger(d)) {
            const signOfD = d >= 0 ? 1 : -1;
            const qr = this._divBase(d);

            const bn = new BigNumber(qr.Q);
            bn._sign = this._sign * signOfD;
            bn._remainder = qr.R;
            return bn;
        }

        if (d instanceof BigNumber && d.isInteger) {
            if (d.isZero)
                throw Error('Division by zero');

            if (this.compare(d) < 0) {
                const bn = BigNumber.ZERO;
                bn._remainder = BigNumber.clone(this);
                return bn;
            }

            const N = BigNumber._decompress(this._buf);
            const D = BigNumber._decompress(d.buf);

            const qr = BigNumber._divMod(N, D);

            const bn = new BigNumber(BigNumber._compress(qr.Q));
            bn._sign = this._sign * d.sign;
            bn._remainder = new BigNumber(BigNumber._compress(qr.R));
            return bn;
        }

        throw Error('Not implemented');
    }

    /**
     * Divide with a remainder
     * @param {Array<Number>} aBuf a binary buffer
     * @param {Array<Number>} bBuf a binary buffer
     * @return {object} Q: quotient , R: remainder
     */
    static _divMod(N, D) {
        let Q = [];
        let R = null;

        let bit = 0;
        let n = [];
        let i = N.length - 1;

        while (BigNumber._compare(n, D) < 0 && i >= 0) {
            n = [N[i--]].concat(n);
        }

        if (i < 0) {
            if (BigNumber._compare(n, D) >= 0) {
                bit = 1;
                R = BigNumber._sub(n, D, 2);
            } else {
                bit = 0;
                R = n;
            }

            Q.push(bit);

            return { Q: Q, R: R };
        }

        while (true) {
            if (BigNumber._compare(n, D) >= 0) {
                bit = 1;
                R = BigNumber._sub(n, D, 2);
            } else {
                bit = 0;
                R = n;
            }

            Q.push(bit);
            if (i < 0)
                break;

            n = [N[i--]].concat(R);
        }

        return { Q: Q.reverse(), R: R };
    }

    /**
     * Divide without remainder
     * @param {Array<Number>} aBuf a binary buffer 
     * @param {Array<Number>} bBuf a binary buffer
     * @return {object} Q: quotient, F: float
     */
    static _div(aBuf, bBuf) {
        const N = BigNumber._decompress(aBuf);
        const D = BigNumber._decompress(bBuf);

        const qr = BigNumber._divMod(N, D);

        if (BigNumber._isZero(qr.R))
            return { Q: qr.Q, F: 0 };

        let Q = [];
        let R = null;

        let n = qr.R;
        while (BigNumber._compare(n, D) < 0) {
            n = [0].concat(n);
            Q.push(0);
        }

        let bit = 0;
        let i = 0;
        while (true) {
            if (BigNumber._compare(n, D) >= 0) {
                bit = 1;
                R = BigNumber._sub(n, D, 2);
            } else {
                bit = 0;
                R = n;
            }

            Q.push(bit);
            if (i === BigNumber.STEP || BigNumber._isZero(R))
                break;

            n = [0].concat(R);
            i++;
        }

        let float = 0;
        for (let i = Q.length - 1; i > 0; i--) {
            float = (float + Q[i]) / 2;
        }

        return { Q: qr.Q, F: float };
    }

    div(d) {
        if (d === 0)
            throw Error('Division by zero');

        if (d === 1)
            return BigNumber.clone(this);

        if (this.isZero)
            return BigNumber.ZERO;

        let D = d;
        if (!(d instanceof BigNumber))
            D = new BigNumber(d);

        if (!D.isInteger)
            throw Error('Not implemented');

        const qr = BigNumber._div(this._buf, D.buf);

        const bn = new BigNumber(BigNumber._compress(qr.Q));
        bn._float = qr.F;
        bn._sign = this._sign * D.sign;
        return bn;
    }

    /**
     * Shift left a compress buffer by n bit
     * @param {Array<Number>} buf a compress buffer
     * @param {Number} n bits need shift
     * @return {Array<Number>} a compress buffer
     */
    static _shiftLeft(buf, n) {
        const q = Math.floor(n / BigNumber.EXPONENT);
        const r = n % BigNumber.EXPONENT;

        let result = [];

        while (result.length < q) {
            result.push(0);
        }

        if (r > 0) {
            let e = (buf[0] << r) & (BigNumber.BASE - 1);
            result.push(e);

            for (let i = 1; i < buf.length; i++) {
                e = ((buf[i] << r) & (BigNumber.BASE - 1)) | (buf[i - 1] >> (BigNumber.EXPONENT - r));
                result.push(e);
            }

            e = buf[buf.length - 1] >> (BigNumber.EXPONENT - r);
            if (e > 0)
                result.push(e);
        } else {
            for (let i = 0; i < buf.length; i++) {
                result.push(buf[i]);
            }
        }

        return result;
    }

    shiftLeft(n) {
        if (this.isZero)
            return BigNumber.ZERO;

        if (n === 0)
            return BigNumber.clone(this);

        const buf = BigNumber._shiftLeft(this._buf, n);
        return new BigNumber(buf);
    }

    /**
     * Shift right a compress buffer by n bit
     * @param {Array<Number>} buf a compress buffer
     * @param {Number} n bits need shift
     * @return {Array<Number>} a compress buffer
     */
    static _shiftRight(buf, n) {
        const q = Math.floor(n / BigNumber.EXPONENT);
        const r = n % BigNumber.EXPONENT;

        let result = [];
        for (let i = q; i < buf.length; i++) {
            result.push(buf[i]);
        }

        if (r > 0) {
            for (let i = 0; i < result.length - 1; i++) {
                result[i] = (result[i] >> r) | ((result[i + 1] << (BigNumber.EXPONENT - r)) & (BigNumber.BASE - 1));
            }

            result[result.length - 1] = result[result.length - 1] >> r;
        }

        if (result.length === 0)
            result.push(0);

        return result;
    }

    shiftRight(n) {
        if (this.isZero)
            return BigNumber.ZERO;

        if (n === 0)
            return BigNumber.clone(this);

        const buf = BigNumber._shiftRight(this._buf, n);
        return new BigNumber(buf);
    }

    xor(n) {
        let buf = [];
        for (let i = 0; i < this._buf.length; i++) {
            buf[i] = this._buf[i];
        }

        buf[0] = this._buf[0] ^ n;

        return new BigNumber(buf);
    }

    pow(exponent) {
        if (!Number.isInteger(exponent))
            throw Error('Not implemented');

        if (exponent === 0)
            return BigNumber.ONE;

        if (exponent === 1)
            return BigNumber.clone(this);

        let base = BigNumber.clone(this);
        let result = BigNumber.ONE;

        while (exponent > 0) {
            if (exponent & 1 === 1) {
                result = result.mul(base);
                exponent--;
                continue;
            }

            base = base.mul(base);
            exponent >>= 1;
        }

        return result;
    }

    toSmall() {
        if (BigNumber._compare(this._buf, [0, 0, 31]) > 0)
            throw Error('Value too large');

        let r = 0;
        for (let i = this._buf.length - 1; i > 0; i--) {
            r = (this._buf[i] + r) * BigNumber.BASE;
        }
        r += this._buf[0];

        r += this._float;
        if (this._sign > 0)
            return r;

        return -r;
    }
}

BigNumber.LOOKUP_CHARS = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14,
    'f': 15
};
BigNumber.LOOKUP_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
BigNumber.BIN_HEX = {
    '0000': '0', '0001': '1', '0010': '2', '0011': '3',
    '0100': '4', '0101': '5', '0110': '6', '0111': '7',
    '1000': '8', '1001': '9', '1010': 'a', '1011': 'b',
    '1100': 'c', '1101': 'd', '1110': 'e', '1111': 'f'
};
BigNumber.HEX_BIN = {
    '0': [0, 0, 0, 0], '1': [0, 0, 0, 1], '2': [0, 0, 1, 0], '3': [0, 0, 1, 1],
    '4': [0, 1, 0, 0], '5': [0, 1, 0, 1], '6': [0, 1, 1, 0], '7': [0, 1, 1, 1],
    '8': [1, 0, 0, 0], '9': [1, 0, 0, 1], 'a': [1, 0, 1, 0], 'b': [1, 0, 1, 1],
    'c': [1, 1, 0, 0], 'd': [1, 1, 0, 1], 'e': [1, 1, 1, 0], 'f': [1, 1, 1, 1]
}

BigNumber.FACTOR = 2;
BigNumber.EXPONENT = 24; // 2^24 * 2^24 < MAX_SAFE_INTEGER
BigNumber.BASE = Math.pow(BigNumber.FACTOR, BigNumber.EXPONENT);
BigNumber.STEP = 53;
BigNumber.ZERO = new BigNumber(0);
BigNumber.ONE = new BigNumber(1);

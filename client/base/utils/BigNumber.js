/**
 * Version: 0.1.0
 * Create By: dongnh@vtc.vn
 */

// https://en.wikipedia.org/wiki/Multiplication_algorithm

class BigNumber {
    constructor(bn, base) {
        this._base = base || BigNumber.BASE;

        if (bn && NumberUtils.isUint32(bn)) {
            this._buf = [];

            do {
                this._buf.push(bn % this._base);
                bn = Math.floor(bn / this._base);
            } while (bn > 0);

            return;
        }

        if (bn && (typeof bn === 'string')) {
            this._base10StringToBASE(bn, this._base);
            return;
        }

        if (bn && bn instanceof Array) {
            this._buf = bn;
            return;
        }

        if (bn && bn instanceof BigNumber) {
            if (bn.buf === null)
                throw Error('Malformed value');
            if (!(bn.buf instanceof Array))
                throw Error('Malformed value');
            if (bn.buf.length == 0)
                throw Error('Malformed length');

            for (let i = 0; i < bn.buf.length; i++)
                this._buf[i] = bn.buf[i];

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

        return new BigNumber(buf, this._base);
    }

    toString(base) {
        let buf = null;
        if (BigNumber.BASE !== 1e6)
            buf = this._toBase(1e6).buf;
        else
            buf = this._buf;

        let s = buf[buf.length - 1].toString();

        for (let i = buf.length - 2; i >= 0; i--) {
            let n = buf[i].toString();
            while (n.length < 6) {
                n = '0' + n;
            }

            s += n;
        }

        return s;
    }

    equals(obj) {
        return obj instanceof BigNumber
            && this._buf.length === obj.buf.length
            && this._buf.every((value, i) => value === obj.buf[i]);
    }

    compare(obj) {
        if (this._buf.length > obj.buf.length)
            return 1;
        if (this._buf.length < obj.buf.length)
            return -1;

        for (let i = this._buf.length - 1; i >= 0; i--) {
            if (this._buf[i] > obj.buf[i])
                return 1;
            if (this._buf[i] < obj.buf[i])
                return -1;
        }

        return 0;
    }

    get isZero() {
        for (let i = 0; i < this._buf.length; i++) {
            if (this._buf[i] > 0)
                return false;
        }

        return true;
    }

    get isOne() {
        return this._buf.length === 1 && this._buf[0] === 1;
    }

    get buf() {
        return this._buf;
    }

    _divBase(d) {
        let buf = [];
        let n = 0;
        let i = this._buf.length - 1;

        while (n < d && i >= 0) {
            n = n * this._base + this._buf[i--];
        }

        if (i < 0) {
            buf.push(Math.floor(n / d));
            return { Q: new BigNumber(buf), R: n % d };
        }

        while (true) {
            buf.push(Math.floor(n / d));
            if (i < 0)
                break;

            n = (n % d) * this._base + this._buf[i--];
        }

        return { Q: new BigNumber(buf.reverse()), R: n % d };
    }

    static _divBase10String(s, d) {
        let q = '';
        let n = 0;
        let i = 0;

        while (n < d && i < s.length) {
            n = n * 10 + (s[i++] - '0');
        }

        if (i === s.length) {
            q += Math.floor(n / d);
            return { Q: q, R: n % d };
        }

        while (true) {
            q += Math.floor(n / d);
            if (i > s.length - 1)
                break;

            n = (n % d) * 10 + (s[i++] - '0');
        }

        return { Q: q, R: n % d };
    }

    _base10StringToBASE(s, base) {
        this._buf = [];

        do {
            let r = BigNumber._divBase10String(s, base);
            this._buf.push(r.R);
            s = r.Q;
        } while (s !== '0');
    }

    _toBase(base) {
        let result = new BigNumber(0, base);

        for (let i = this._buf.length - 1; i >= 1; i--) {
            result = result.add(this._buf[i]).mul(this._base);
        }

        return result.add(this._buf[0]);
    }

    get bin() {
        return this._toBase(2).buf;
    }

    get hex() {
        const lookup = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

        const buf = this._toBase(16).buf;

        let s = '';
        for (let i = buf.length - 1; i >= 0; i--) {
            s += lookup[buf[i]];
        }

        return s;
    }

    add(obj) {
        let bn = null;

        if (NumberUtils.isUint32(obj)) {
            bn = new BigNumber(obj, this._base);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        return this._add(this, bn);
    }

    _add(a, b) {
        let buf = [];
        let carry = 0;
        const length = Math.max(a.buf.length, b.buf.length);

        let i = 0;
        while (i < length || carry > 0) {
            const summary = (a.buf[i] || 0) + (b.buf[i] || 0) + carry;
            carry = Math.floor(summary / this._base);
            buf[i] = summary % this._base;
            i++;
        }

        return new BigNumber(buf, this._base);
    }

    sub(obj) {
        let bn = null;

        if (NumberUtils.isUint32(obj)) {
            bn = new BigNumber(obj, this._base);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        if (this.compare(bn) > 0)
            return this._sub(this, bn);

        return this._sub(bn, this);
    }

    _sub(a, b) {
        let buf = [];
        let carry = 0;

        for (let i = 0; i < a.buf.length; i++) {
            let difference = a.buf[i] - b.buf[i] - carry;
            if (difference < 0) {
                difference += this._base;
                carry = 1;
            } else
                carry = 0;

            buf[i] = difference;
        }

        return new BigNumber(buf, this._base);
    }

    mul(obj) {
        let bn = null;

        if (NumberUtils.isUint32(obj)) {
            bn = new BigNumber(obj, this._base);
        } else if (obj instanceof BigNumber) {
            bn = obj;
        }

        if (this.isZero || bn.isZero) {
            return new BigNumber(0, this._base);
        }

        return this._mul(this, bn);
    }

    _mul(a, b) {
        let buf = [];

        for (let i = 0; i < a.buf.length + b.buf.length; i++)
            buf.push(0);

        for (let ib = 0; ib < b.buf.length; ib++) {
            let carry = 0;
            for (let ia = 0; ia < a.buf.length; ia++) {
                buf[ia + ib] += carry + (a.buf[ia] * b.buf[ib]);
                carry = Math.floor(buf[ia + ib] / this._base);
                buf[ia + ib] = buf[ia + ib] % this._base;
            }

            buf[ib + a.buf.length] += carry;
        }

        if (buf[b.buf.length + a.buf.length - 1] === 0)
            buf = buf.slice(0, -1);

        return new BigNumber(buf, this._base);
    }

    mod(n) {
        if (!NumberUtils.isUint32(n))
            throw Error('Not implemented');

        let result = 0;

        for (let i = this._buf.length - 1; i >= 0; i--) {
            result = (result * this._base + this._buf[i]) % n;
        }

        return result;
    }

    div(d) {
        if (!NumberUtils.isUint32(d))
            throw Error('Not implemented');

        if (d === 0)
            throw Error('Division by zero');

        if (this.isZero)
            return new BigNumber(0, this._base);

        if (d === 1)
            return BigNumber.clone(this);

        return this._div(this, d);
    }

    _div(a, b) {
        return a._divBase(b).Q;
    }

    shift(n) {
        if (this.isZero)
            return new BigNumber(0, this._base);


    }

    pow(exponent) {
        if (exponent === 0)
            return new BigNumber(1, this._base);

        if (exponent === 1)
            return BigNumber.clone(this);

        let base = BigNumber.clone(this);
        let result = new BigNumber(1, this._base);

        while (exponent > 0) {
            if (exponent % 2 == 1) {
                result = result.mul(base);
                exponent--;
                continue;
            }

            base = base.mul(base);
            exponent = Math.floor(exponent / 2);
        }

        return result;
    }
}

BigNumber.FACTOR = 2;
BigNumber.EXPONENT_BASE = 20; // UINT32_MAX * 2^20 < MAX_SAFE_INTEGER
BigNumber.BASE = Math.pow(BigNumber.FACTOR, BigNumber.EXPONENT_BASE);

BigNumber.powersOfTwo = [1];
while (2 * BigNumber.powersOfTwo[BigNumber.powersOfTwo.length - 1] <= BigNumber.BASE)
    BigNumber.powersOfTwo.push(2 * BigNumber.powersOfTwo[BigNumber.powersOfTwo.length - 1]);

BigNumber.powers2Length = BigNumber.powersOfTwo.length;
BigNumber.highestPower2 = BigNumber.powersOfTwo[BigNumber.powers2Length - 1];




const WIDTH = 256 / 32;

class BlockUtils {
    bits() {
        for (let pos = WIDTH - 1; pos >= 0; pos--) {
            if (pn[pos]) {
                for (let nbits = 31; nbits > 0; nbits--) {
                    if (pn[pos] & 1 << nbits)
                        return 32 * pos + nbits + 1;
                }
                return 32 * pos + 1;
            }
        }
        return 0;
    }

    //N = (-1^sign) * mantissa * 256^(exponent - 3)
    static setCompact(bits) {
        let target = 0;

        const exponent = bits >> 24;
        const mantissa = bits & 0x007fffff;
        if (exponent <= 3) {
            target = mantissa >> 8 * (3 - exponent);
        } else {
            target = mantissa << 8 * (exponent - 3);
        }

        const negative = target != 0 && (bits & 0x00800000) != 0;
        const overflow = target != 0 && ((exponent > 34) ||
            (target > 0xff && exponent > 33) ||
            (target > 0xffff && exponent > 32));

        if (overflow)
            throw Error('setCompact: overflow');

        return target;
    }

    static getCompact(target) {
        if (!Number.isFinite(target) || Number.isNaN(target))
            throw 'Invalid Target';

        /*
    const nSize = (bits() + 7) / 8;
    let nCompact = 0;
 
    if (nSize <= 3) {
        nCompact = GetLow64() << 8 * (3 - nSize);
    } else {
        bn =  >> 8 * (nSize - 3);
        nCompact = bn.GetLow64();
    }
 
    return nCompact;
*/
    }

    static isProofOfWork(hash, difficulty) {
        let count = 0;
        for (let i = 0; i < hash.length; i++) {
            for (let j = 7; j >= 0; j--) {
                if (((hash[i] >> j) & 1) === 1)
                    return (count === difficulty);
                count++;
            }
        }

        return (count === difficulty);
    }

    static getDifficulty(nBits) {
        // 0x00ffff * 2**(8*(0x1d - 3))
        Math.exp(Math.log(65535) - Math.log(Bits % Math.pow(2, 25)) +
            Math.log(256) * (29 - Math.floor(Bits / Math.pow(2, 24))));

        let nShift = (nBits >> 24) & 0xff;
        let dDiff = parseFloat(0x0000ffff) / parseFloat(nBits & 0x00ffffff);
        while (nShift < 29) {
            dDiff *= 256.0;
            nShift++;
        }

        while (nShift > 29) {
            dDiff /= 256.0;
            nShift--;
        }

        return dDiff;
    }
}

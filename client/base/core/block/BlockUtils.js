

class BlockUtils {

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

    static getTargetFromBits(bits) {
        const shift = bits >> 24;
        const value = new BigNumber(bits & 0x007fffff);
        return value.shiftLeft(8 * (shift - 3));
    }

    static getDifficulty(nBits) {
        // 0x00ffff * 2**(8*(0x1d - 3))
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

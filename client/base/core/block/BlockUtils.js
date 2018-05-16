const TARGET_TIMESPAN = 1209600;

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

    static getTargetFromBits(nBits) {
        const shift = nBits >> 24;
        const value = new BigNumber(nBits & 0x007fffff);
        return value.shiftLeft(8 * (shift - 3));
    }

    static getBitsFromTarget(target) {
        const bitLength = target.bits + 1;
        const size = Math.floor((bitLength + 7) / 8);
        const value = target.shiftRight(8 * (size - 3));
        return value.xor(size << 24);
    }

    static changeTarget(prevBits, startingTimeSecs, prevTimeSecs) {
        const oldTarget = BlockUtils.getTargetFromBits(prevBits);
        const timeSpanSeconds = prevTimeSecs - startingTimeSecs;
        let newTarget = oldTarget;
        newTarget *= timeSpanSeconds;
        newTarget /= TARGET_TIMESPAN;
        return newTarget;
    }

    static getDifficulty(nBits) {
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

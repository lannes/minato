const TARGET_TIMESPAN = 2016 * 10 * 60;

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

    /**
     * @param {Uint8Array} hash
     * @param {BigNumber} target
     * @return {boolean}
     */
    static isProofOfWork2(hash, target) {
        const hashTarget = BigNumber._fromByteArray(hash);
        return BigNumber._compare(hashTarget, target.buf) <= 0;
    }

    static hashToTarget(hash) {
        return BigNumber.fromArray(hash);
    }

    /**
     * Get target from bits: (bits & 0x007fffff) * 2 ** (8 * ((bits >> 24) - 3))
     * @param {Number} nBits integer 32 bits
     * @return {BigNumber} target 
     */
    static getTargetFromBits(nBits) {
        return new BigNumber(nBits & 0x007fffff).shiftLeft(8 * ((nBits >> 24) - 3));
    }

    /**
     * Get bits from target
     * @param {BigNumber} target
     * @return {Number} a integer 32 bits
     */
    static getBitsFromTarget(target) {
        const size = (target.bitLength + 8) >> 3;
        const bn = target.shiftRight(8 * (size - 3));
        return bn.toSmall() | (size << 24);
    }

    /**
     * Get difficulty from bits
     * @param {Number} nBits a integer 32 bits
     * @return {BigNumber} difficulty
     */
    static getDifficultyFromBits(nBits) {
        const oneTarget = BlockUtils.getTargetFromBits(0x1d00ffff);
        const target = BlockUtils.getTargetFromBits(nBits);
        return oneTarget.div(target);
    }

    /**
     * Change target 
     * @param {Number} prevBits 
     * @param {Number} startingTimestamp 
     * @param {Number} prevTimestamp 
     * @return {BigNumber} a new target
     */
    static getNextTarget(prevBits, startingTimestamp, prevTimestamp) {
        const seconds = prevTimestamp - startingTimestamp;
        const target = BlockUtils.getTargetFromBits(prevBits);
        return target.mul(seconds).divMod(TARGET_TIMESPAN);
    }
}

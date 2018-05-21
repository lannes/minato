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

    /**
     * Get target from bits
     * @param {Number} nBits integer 32 bits
     * @return {BigNumber} target 
     */
    static getTargetFromBits(nBits) {
        const shift = nBits >> 24;
        const value = new BigNumber(nBits & 0x007fffff);
        return value.shiftLeft(8 * (shift - 3));
    }

    /**
     * Get bits from target
     * @param {BigNumber} target 
     * @return {Number} a integer 32 bits
     */
    static getBitsFromTarget(target) {
        const bitLength = target.bits + 1;
        const size = Math.floor((bitLength + 7) / 8);
        const value = target.shiftRight(8 * (size - 3));
        return value.xor(size << 24);
    }

    static getDifficultyFromBits(bits) {
        //difficulty_one_target = 0x00ffff * 2 ** (8 * (0x1d - 3))
        const difficulty_one_target = BigNumber.fromHex('0x00ffff').shiftLeft(8 * (0x1d - 3));
        const target = BlockUtils.getTargetFromBits(bits);
        const calculated_difficulty = difficulty_one_target.div(target);
        return calculated_difficulty;
    }

    /**
     * Change target 
     * @param {Number} prevBits 
     * @param {Number} startingTimeSecs 
     * @param {Number} prevTimeSecs 
     * @return {BigNumber} a new target
     */
    static changeTarget(prevBits, startingTimeSecs, prevTimeSecs) {
        const oldTarget = BlockUtils.getTargetFromBits(prevBits);
        const timeSpanSeconds = prevTimeSecs - startingTimeSecs;
        let newTarget = oldTarget;
        newTarget = newTarget.mul(timeSpanSeconds);
        newTarget = newTarget.divMod(TARGET_TIMESPAN);
        return newTarget;
    }
}

/*
const bits = 486594666;
const difficulty = 1.18;
const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
const allowed_error = 0.01;

const block_difficulty = new BigNumber(difficulty);
const sub = calculated_difficulty.sub(block_difficulty);
console.log(`${block_difficulty.toString()} ${calculated_difficulty.toString()} ${sub.toString()}`);
*/

const bits = 453062093;
const difficulty = 55589.52;
const calculated_difficulty = BlockUtils.getDifficultyFromBits(bits);
const allowed_error = 0.01;

const block_difficulty = new BigNumber(difficulty);
const sub = calculated_difficulty.sub(block_difficulty);
console.log(`${block_difficulty.toString()} ${calculated_difficulty.toString()} ${sub.toString()}`);




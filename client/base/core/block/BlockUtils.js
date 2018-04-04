
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
}

if (typeof module !== 'undefined')
    module.exports = BlockUtils;
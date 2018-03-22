class Block {
    static isValidBlockStructure(block) {
        return typeof block['index'] === 'number'
            && typeof block['hash'] === 'string'
            && typeof block['previousHash'] === 'string'
            && typeof block['timestamp'] === 'number'
            && typeof block['data'] === 'object';
    }

    static isValidTimestamp(newBlock, previousBlock) {
        return (previousBlock['timestamp'] - 60 < newBlock['timestamp'])
            && newBlock['timestamp'] - 60 < getCurrentTimestamp();
    }

    static async calculateHash(index, previousHash, timestamp, data, difficulty, nonce) {
        return await sha256(index + previousHash + timestamp + data + difficulty + nonce);
    }

    static async calculateHashForBlock(block) {
        return await Block.calculateHash(
            block['index'],
            block['previousHash'],
            block['timestamp'],
            block['data'],
            block['difficulty'],
            block['nonce']);
    }

    static async hashMatchesBlockContent(block) {
        const blockHash = await Block.calculateHashForBlock(block);
        return blockHash === block['hash'];
    }

    static hashMatchesDifficulty(hash, difficulty) {
        const hashInBinary = hexToBinary(hash);
        const requiredPrefix = '0'.repeat(difficulty);
        return hashInBinary.startsWith(requiredPrefix);
    }

    static async hasValidHash(block) {
        if (!(await Block.hashMatchesBlockContent(block))) {
            console.log('invalid hash, got:' + block['hash']);
            return false;
        }

        if (!Block.hashMatchesDifficulty(block['hash'], block['difficulty'])) {
            console.log('block difficulty not satisfied. Expected: %s got: %s', block['difficulty'], block['hash']);
            return false;
        }

        return true;
    }

    static async isValidNewBlock(newBlock, previousBlock) {
        if (!Block.isValidBlockStructure(newBlock)) {
            return false;
        }

        if (previousBlock['index'] !== (newBlock['index'] - 1)) {
            return false;
        }

        if (previousBlock['hash'] !== newBlock['previousHash']) {
            return false;
        }

        if (!Block.isValidTimestamp(newBlock, previousBlock)) {
            return false;
        }

        if (!(await Block.hasValidHash(newBlock))) {
            return false;
        }

        return true;
    }
}
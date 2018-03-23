if (typeof require !== 'undefined')
    global.KHash = require('../nodejs/crypto/hash');

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

    static calculateHash(index, previousHash, timestamp, data, difficulty, nonce) {
        return KHash.sha256(index + previousHash + timestamp + data + difficulty + nonce);
    }

    static calculateHashForBlock(block) {
        return Block.calculateHash(
            block['index'],
            block['previousHash'],
            block['timestamp'],
            block['data'],
            block['difficulty'],
            block['nonce']);
    }

    static hashMatchesBlockContent(block) {
        const blockHash = Block.calculateHashForBlock(block);
        return blockHash === block['hash'];
    }

    static hashMatchesDifficulty(hash, difficulty) {
        const hashInBinary = hexToBinary(hash);
        const requiredPrefix = '0'.repeat(difficulty);
        return hashInBinary.startsWith(requiredPrefix);
    }

    static hasValidHash(block) {
        if (!Block.hashMatchesBlockContent(block)) {
            console.log('invalid hash, got:' + block['hash']);
            return false;
        }

        if (!Block.hashMatchesDifficulty(block['hash'], block['difficulty'])) {
            console.log('block difficulty not satisfied. Expected: %s got: %s', block['difficulty'], block['hash']);
            return false;
        }

        return true;
    }

    static isValidNewBlock(newBlock, previousBlock) {
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

        if (!Block.hasValidHash(newBlock)) {
            return false;
        }

        return true;
    }
}

if (typeof module !== 'undefined')
    module.exports = Block;

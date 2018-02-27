const isValidBlockStructure = (block) => {
    return typeof block['index'] === 'number'
        && typeof block['hash'] === 'string'
        && typeof block['previousHash'] === 'string'
        && typeof block['timestamp'] === 'number'
        && typeof block['data'] === 'object';
}

const isValidTimestamp = (newBlock, previousBlock) => {
    return (previousBlock['timestamp'] - 60 < newBlock['timestamp'])
        && newBlock['timestamp'] - 60 < getCurrentTimestamp();
}

const calculateHash = async (index, previousHash, timestamp, data, difficulty, nonce) =>
    await sha256(index + previousHash + timestamp + data + difficulty + nonce);

const calculateHashForBlock = async (block) =>
    await calculateHash(block['index'],
        block['previousHash'],
        block['timestamp'],
        block['data'],
        block['difficulty'],
        block['nonce']);

const hashMatchesBlockContent = async (block) => {
    const blockHash = await calculateHashForBlock(block);
    return blockHash === block['hash'];
}

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
}

const hasValidHash = async (block) => {
    if (!(await hashMatchesBlockContent(block))) {
        console.log('invalid hash, got:' + block['hash']);
        return false;
    }

    if (!hashMatchesDifficulty(block['hash'], block['difficulty'])) {
        console.log('block difficulty not satisfied. Expected: %s got: %s', block['difficulty'], block['hash']);
        return false;
    }

    return true;
}

const isValidNewBlock = async (newBlock, previousBlock) => {
    if (!isValidBlockStructure(newBlock)) {
        return false;
    }

    if (previousBlock['index'] !== (newBlock['index'] - 1)) {
        return false;
    }

    if (previousBlock['hash'] !== newBlock['previousHash']) {
        return false;
    }

    if (!isValidTimestamp(newBlock, previousBlock)) {
        return false;
    }

    if (!(await hasValidHash(newBlock))) {
        return false;
    }

    return true;
}

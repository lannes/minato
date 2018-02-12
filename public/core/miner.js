
importScripts('../util/hash.js');

const STANDARD_ROUNDS = 100000;

const hexToBinary = (s) => {
    let ret = '';
    const lookupTable = {
        '0': '0000', '1': '0001', '2': '0010', '3': '0011', '4': '0100',
        '5': '0101', '6': '0110', '7': '0111', '8': '1000', '9': '1001',
        'a': '1010', 'b': '1011', 'c': '1100', 'd': '1101',
        'e': '1110', 'f': '1111'
    };

    for (let i = 0; i < s.length; i++) {
        if (lookupTable[s[i]]) {
            ret += lookupTable[s[i]];
        } else {
            return null;
        }
    }

    return ret;
};

const calculateHash = async (index, previousHash, timestamp, data, difficulty, nonce) =>
    await sha256(index + previousHash + timestamp + data + difficulty + nonce);

const hashMatchesDifficulty = (hash, difficulty) => {
    const hashInBinary = hexToBinary(hash);
    const requiredPrefix = '0'.repeat(difficulty);
    return hashInBinary.startsWith(requiredPrefix);
};

let block = null;
let rounds = STANDARD_ROUNDS;
let startNonce = 0;

const mineBlock = async () => {
    for (let nonce = startNonce; nonce < startNonce + rounds; nonce++) {
        const hash = await calculateHash(
            block['index'],
            block['previousHash'],
            block['timestamp'],
            block['data'],
            block['difficulty'],
            nonce
        );

        if (hashMatchesDifficulty(hash, block['difficulty'])) {
            block['hash'] = hash;
            block['nonce'] = nonce;
            break;
        }
    }

    if (block['nonce'] !== 0) {
        startNonce = 0;
        minerPort.postMessage({ 'cmd': 'newblock', 'block': block });
    } else {
        startNonce += rounds;
        setTimeout(mineBlock, 0);
    }
};

let minerPort = null;

const onMessageFromCore = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'mine':
            block = data['block'];
            await mineBlock();
            break;
        default:
            break;
    }
};

this.onmessage = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'connect':
            minerPort = event.ports[0];
            minerPort.onmessage = onMessageFromCore;
            break;
        case 'mine':
            minerPort.postMessage({ 'cmd': 'mine', 'block': block });
            break;
        default:
            break;
    }
};

const genesisTransaction = {
    'id': 'e655f6a5f26dc9b4cac6e46f52336428287759cf81ef5ff10854f69d68f43fa3',
    'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
    'txOuts': [{
        'address': '04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a',
        'amount': 50
    }]
};

const genesisBlock = {
    'index': 0,
    'hash': '91a73664bc84c0baa1fc75ea6e4aa6d1d20c5df664c724e3159aefc2e1186627',
    'previousHash': '',
    'timestamp': 1465154705,
    'data': [genesisTransaction],
    'difficulty': 0,
    'nonce': 0
};

let blockchain = [genesisBlock];

let unspentTxOuts = null;

const initBlockchain = async () => {
    unspentTxOuts = await processTransactions(blockchain[0].data, [], 0);
};

const isValidGenesis = (block) => {
    return JSON.stringify(block) === JSON.stringify(genesisBlock);
};

const getBlockchain = () => blockchain;

const getUnspentTxOuts = () => cloneDeep(unspentTxOuts);

// and txPool should be only updated at the same time
const setUnspentTxOuts = (newUnspentTxOut) => {
    unspentTxOuts = newUnspentTxOut;
};

const getLatestBlock = () => blockchain[blockchain.length - 1];

// in seconds
const BLOCK_GENERATION_INTERVAL = 10 * 6;

// in blocks
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

const getDifficulty = (aBlockchain) => {
    const latestBlock = aBlockchain[blockchain.length - 1];
    if (latestBlock['index'] % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock['index'] !== 0) {
        return getAdjustedDifficulty(latestBlock, aBlockchain);
    } else {
        return latestBlock['difficulty'];
    }
}

const getAdjustedDifficulty = (latestBlock, aBlockchain) => {
    const prevAdjustmentBlock = aBlockchain[blockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
    const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
    const timeTaken = latestBlock['timestamp'] - prevAdjustmentBlock['timestamp'];
    if (timeTaken < timeExpected / 2) {
        return prevAdjustmentBlock['difficulty'] + 1;
    } else if (timeTaken > timeExpected * 2) {
        return prevAdjustmentBlock['difficulty'] - 1;
    } else {
        return prevAdjustmentBlock['difficulty'];
    }
}

const generateRawNextBlock = async (blockData) => {
    const previousBlock = getLatestBlock();
    const difficulty = getDifficulty(getBlockchain());
    const nextIndex = previousBlock['index'] + 1;
    const nextTimestamp = getCurrentTimestamp();
    const newBlock = await mine(nextIndex, previousBlock['hash'], nextTimestamp, blockData, difficulty);

    if (await addBlockToChain(newBlock)) {
        return newBlock;
    } else {
        return null;
    }
};

// gets the unspent transaction outputs owned by the wallet
const getMyUnspentTransactionOutputs = () => {
    return Wallet.findUnspentTxOuts(Wallet.getPublicFromWallet(), getUnspentTxOuts());
};

/**
 * Đào khối để xử lý các giao dịch chưa được xác thực và nhận thưởng coin
 */
const generateNextBlock = async () => {
    const address = Wallet.getPublicFromWallet();
    const coinbaseTx = await getCoinbaseTransaction(address, getLatestBlock()['index'] + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());
    return await generateRawNextBlock(blockData);
};

const mine = async (index, previousHash, timestamp, data, difficulty) => {
    let nonce = 0;
    while (true) {
        const hash = await calculateHash(index, previousHash, timestamp, data, difficulty, nonce);
        if (hashMatchesDifficulty(hash, difficulty)) {
            return {
                'index': index,
                'hash': hash,
                'previousHash': previousHash,
                'timestamp': timestamp,
                'data': data,
                'difficulty': difficulty,
                'nonce': nonce
            };
        }

        nonce++;
    }
};

const sendTransaction = async (address, amount) => {
    const tx = await Wallet.createTransaction(
        address,
        amount,
        Wallet.getPrivateFromWallet(),
        getUnspentTxOuts(),
        getTransactionPool()
    );

    await addToTransactionPool(tx, getUnspentTxOuts());
    return tx;
};

const getAccumulatedDifficulty = (aBlockchain) => {
    return aBlockchain
        .map((block) => block['difficulty'])
        .map((difficulty) => Math.pow(2, difficulty))
        .reduce((a, b) => a + b);
}

/*
    Lấy danh sách các giao dịch chưa tiêu trong quá trình kiểm tra chuỗi khối
 */
const isValidChain = async (blockchainToValidate) => {
    if (!isValidGenesis(blockchainToValidate[0]))
        return null;

    let aUnspentTxOuts = [];

    for (let i = 0; i < blockchainToValidate.length; i++) {
        const currentBlock = blockchainToValidate[i];
        if (i !== 0 && !(await isValidNewBlock(blockchainToValidate[i], blockchainToValidate[i - 1]))) {
            return null;
        }

        aUnspentTxOuts = await processTransactions(currentBlock['data'], aUnspentTxOuts, currentBlock['index']);
        if (aUnspentTxOuts === null) {
            console.log('invalid transactions in blockchain');
            return null;
        }
    }

    return aUnspentTxOuts;
}

const addBlockToChain = async (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        const retVal = await processTransactions(newBlock['data'], getUnspentTxOuts(), newBlock['index']);
        if (retVal === null) {
            console.log('block is not valid in terms of transactions');
            return false;
        } else {
            blockchain.push(newBlock);
            setUnspentTxOuts(retVal);
            updateTransactionPool(unspentTxOuts);
            return true;
        }
    }

    return false;
}

const consensus = async (newBlocks) => {
    const aUnspentTxOuts = await isValidChain(newBlocks);
    const validChain = aUnspentTxOuts !== null;
    if (validChain &&
        getAccumulatedDifficulty(newBlocks) > getAccumulatedDifficulty(getBlockchain())) {
        blockchain = newBlocks;
        setUnspentTxOuts(aUnspentTxOuts);
        updateTransactionPool(unspentTxOuts);
        return true;
    }

    return false;
}

const handleReceivedTransaction = async (transaction) => {
    await addToTransactionPool(transaction, getUnspentTxOuts());
}
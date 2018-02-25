const genesisTransaction = {
    'id': 'cb5619df923aed543813092583db69c59880c3d416c0ef6076fa88a304e328e8',
    'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
    'txOuts': [{
        'address': 'Gt5TMnHCvW6XoRzdgVOwkjUzkMBsx0KOMmkxCBvXP34vLsFjg98YBuV9sXbsDkPLSrSpBMMIWXJq1YsNt8FHbc',
        'amount': 50
    }]
};

const genesisBlock = {
    'index': 0,
    'hash': '395d5a3abf873ba57506c0986f1f2c62b8d7abea99a012d906dab0be203a686b',
    'previousHash': '',
    'timestamp': 1519493046,
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

// gets the unspent transaction outputs owned by the wallet
const getMyUnspentTransactionOutputs = () => {
    return Wallet.findUnspentTxOuts(Wallet.getPublicFromWallet(), getUnspentTxOuts());
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
const isValidChain = async (blocks) => {
    if (!isValidGenesis(blocks[0]))
        return null;

    let aUnspentTxOuts = [];

    for (let i = 1; i < blocks.length; i++) {
        if (!(await isValidNewBlock(blocks[i], blocks[i - 1]))) {
            console.log('invalid block in blockchain');
            return null;
        }

        const currentBlock = blocks[i];
        aUnspentTxOuts = await processTransactions(currentBlock['data'], aUnspentTxOuts, currentBlock['index']);
        if (aUnspentTxOuts === null) {
            console.log('invalid transactions in blockchain');
            return null;
        }
    }

    return aUnspentTxOuts;
}

const addBlockToChain = async (newBlock) => {
    let isValid = await isValidNewBlock(newBlock, getLatestBlock());
    if (!isValid) {
        return false;
    }

    const retVal = await processTransactions(newBlock['data'], getUnspentTxOuts(), newBlock['index']);
    if (retVal === null) {
        console.log('invalid transactions in blockchain');
        return false;
    }

    blockchain.push(newBlock);
    setUnspentTxOuts(retVal);
    updateTransactionPool(unspentTxOuts);
    return true;
}

const replaceChain = async (newBlocks) => {
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


const BLOCK_GENERATION_INTERVAL = 10 * 6;
const DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

class Blockchain {
    constructor(pool) {
        this.genesisTransaction = {
            'id': 'cb5619df923aed543813092583db69c59880c3d416c0ef6076fa88a304e328e8',
            'txIns': [{ 'signature': '', 'txOutId': '', 'txOutIndex': 0 }],
            'txOuts': [{
                'address': 'Gt5TMnHCvW6XoRzdgVOwkjUzkMBsx0KOMmkxCBvXP34vLsFjg98YBuV9sXbsDkPLSrSpBMMIWXJq1YsNt8FHbc',
                'amount': 50
            }]
        };

        this.genesisBlock = {
            'index': 0,
            'hash': '395d5a3abf873ba57506c0986f1f2c62b8d7abea99a012d906dab0be203a686b',
            'previousHash': '',
            'timestamp': 1519493046,
            'data': [this.genesisTransaction],
            'difficulty': 0,
            'nonce': 0
        };

        this.pool = pool;

        this.blocks = [this.genesisBlock];

        this.unspentTxOuts = null;
    }

    init() {
        this.unspentTxOuts = Transaction.process(this.blocks[0]['data'], [], 0);
    }

    isValidGenesis(block) {
        return JSON.stringify(block) === JSON.stringify(this.genesisBlock);
    }

    getBlocks() {
        return this.blocks;
    }

    getUnspentTxOuts() {
        return cloneDeep(this.unspentTxOuts);
    }

    // and txPool should be only updated at the same time
    setUnspentTxOuts(newUnspentTxOut) {
        this.unspentTxOuts = newUnspentTxOut;
    }

    findUnspentTxOuts(address, unspentTxOuts) {
        return unspentTxOuts.filter((uTxO) => uTxO['address'] === address);
    }

    getAccountBalance() {
        const address = Wallet.getPublicFromWallet();
        return this.getBalance(address, this.getUnspentTxOuts());
    }

    getBalance(address, unspentTxOuts) {
        return this.findUnspentTxOuts(address, unspentTxOuts)
            .map((uTxO) => uTxO['amount'])
            .reduce((a, b) => a + b, 0);
    }

    getLatestBlock() {
        return this.blocks[this.blocks.length - 1];
    }

    getDifficulty(aBlockchain) {
        const latestBlock = aBlockchain[aBlockchain.length - 1];
        if (latestBlock['index'] % DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && latestBlock['index'] !== 0) {
            return this.getAdjustedDifficulty(latestBlock, aBlockchain);
        } else {
            return latestBlock['difficulty'];
        }
    }

    getAdjustedDifficulty(latestBlock, aBlockchain) {
        const prevAdjustmentBlock = aBlockchain[aBlockchain.length - DIFFICULTY_ADJUSTMENT_INTERVAL];
        const timeExpected = BLOCK_GENERATION_INTERVAL * DIFFICULTY_ADJUSTMENT_INTERVAL;
        const timeTaken = latestBlock['timestamp'] - prevAdjustmentBlock['timestamp'];

        if (timeTaken < timeExpected / 2)
            return prevAdjustmentBlock['difficulty'] + 1;

        if (timeTaken > timeExpected * 2)
            return prevAdjustmentBlock['difficulty'] - 1;

        return prevAdjustmentBlock['difficulty'];
    }

    // gets the unspent transaction outputs owned by the wallet
    getMyUnspentTransactionOutputs() {
        return Wallet.findUnspentTxOuts(Wallet.getPublicFromWallet(), this.getUnspentTxOuts());
    }

    sendTransaction(address, amount) {
        const tx = Wallet.createTransaction(
            address,
            amount,
            Wallet.getPrivateFromWallet(),
            this.getUnspentTxOuts(),
            this.pool.getTransactionPool()
        );

        this.pool.addToTransactionPool(tx, this.getUnspentTxOuts());
        return tx;
    }

    getAccumulatedDifficulty(aBlockchain) {
        return aBlockchain
            .map((block) => block['difficulty'])
            .map((difficulty) => Math.pow(2, difficulty))
            .reduce((a, b) => a + b);
    }

    /*
        Lấy danh sách các giao dịch chưa tiêu trong quá trình kiểm tra chuỗi khối
     */
    isValidChain(blocks) {
        if (!this.isValidGenesis(blocks[0]))
            return null;

        let aUnspentTxOuts = [];

        for (let i = 1; i < blocks.length; i++) {
            if (!Block.isValidNewBlock(blocks[i], blocks[i - 1])) {
                console.log('invalid block in blockchain');
                return null;
            }

            const currentBlock = blocks[i];
            aUnspentTxOuts = Transaction.process(currentBlock['data'], aUnspentTxOuts, currentBlock['index']);
            if (aUnspentTxOuts === null) {
                console.log('invalid transactions in blockchain');
                return null;
            }
        }

        return aUnspentTxOuts;
    }

    addBlockToChain(newBlock) {
        let isValid = Block.isValidNewBlock(newBlock, this.getLatestBlock());
        if (!isValid)
            return false;

        const retVal = Transaction.process(newBlock['data'], this.getUnspentTxOuts(), newBlock['index']);
        if (retVal === null)
            return false;

        this.blocks.push(newBlock);
        this.setUnspentTxOuts(retVal);
        this.pool.updateTransactionPool(this.unspentTxOuts);
        return true;
    }

    replaceChain(newBlocks) {
        const aUnspentTxOuts = this.isValidChain(newBlocks);
        const validChain = aUnspentTxOuts !== null;
        if (validChain &&
            this.getAccumulatedDifficulty(newBlocks) > this.getAccumulatedDifficulty(this.getBlocks())) {
            this.blocks = newBlocks;
            this.setUnspentTxOuts(aUnspentTxOuts);
            this.pool.updateTransactionPool(this.unspentTxOuts);
            return true;
        }

        return false;
    }
}

if (typeof module !== 'undefined')
    module.exports = Blockchain;

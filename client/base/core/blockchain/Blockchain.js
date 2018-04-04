if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.Block = require('../block/Block');
    global.Wallet = require('../Wallet');
    global.Transaction = require('../transaction/Transaction');
}

class Blockchain extends Observable {
    constructor(blocks) {
        super();

        this._blocks = blocks;

        this._synchronizer = new Synchronizer();
    }

    get tail() {
        return this._blocks[0];
    }

    get head() {
        return this._blocks[this.length - 1];
    }

    get height() {
        return this.head.height;
    }

    get headHash() {
        return this.head.hash();
    }

    get blocks() {
        return this._blocks;
    }

    get length() {
        return this._blocks.length;
    }

    get difficulty() {
        if (this.head.height % Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && this.head.height !== 0) {
            return this.getAdjustedDifficulty();
        } else {
            return this.head.difficulty;
        }
    }

    getAdjustedDifficulty() {
        const prevAdjustmentBlock = this._blocks[this._blocks.length - Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL];
        const timeExpected = Blockchain.BLOCK_GENERATION_INTERVAL * Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL;
        const timeTaken = this.head.timestamp - prevAdjustmentBlock.timestamp;

        if (timeTaken < timeExpected / 2)
            return prevAdjustmentBlock.difficulty + 1;

        if (timeTaken > timeExpected * 2)
            return prevAdjustmentBlock.difficulty - 1;

        return prevAdjustmentBlock.difficulty;
    }

    // gets the unspent transaction outputs owned by the wallet
    totalDifficulty(blocks) {
        return blocks.reduce((sum, block) => sum + Math.pow(2, block.difficulty), 0);
    }

    verifyGenesis(block) {
        return block.equals(GenesisConfig.GENESIS_BLOCK);
    }

    verifyBlocks(blocks) {
        if (!this.verifyGenesis(blocks[0]))
            return null;

        let unspentTxOuts = Transaction.process(blocks[0].transactions, [], 0);

        for (let i = 1; i < blocks.length; i++) {
            if (!Block.verifyNewBlock(blocks[i], blocks[i - 1])) {
                console.log('invalid block in blockchain');
                return null;
            }

            unspentTxOuts = Transaction.process(blocks[i].transactions, unspentTxOuts, blocks[i].height);
            if (unspentTxOuts === null) {
                console.log('invalid transactions in blockchain');
                return null;
            }
        }

        return unspentTxOuts;
    }

    pushBlock(block, unspentTxOuts) {
        return this._synchronizer.push(this._pushBlock.bind(this, block, unspentTxOuts));
    }

    _pushBlock(block, unspentTxOuts) {
        if (!Block.verifyNewBlock(block, this.head))
            return null;

        const newUnspentTxOuts = Transaction.process(block.transactions, unspentTxOuts, block.height);
        if (newUnspentTxOuts !== null) {
            this._blocks.push(block);
        }

        this.notify('push-block', unspentTxOuts);
        return newUnspentTxOuts;
    }

    replaceChain(newBlocks) {
        const unspentTxOuts = this.verifyBlocks(newBlocks);
        if (unspentTxOuts !== null &&
            this.totalDifficulty(newBlocks) > this.totalDifficulty(this._blocks)) {
            this._blocks = newBlocks;
        }

        return unspentTxOuts;
    }
}

Blockchain.BLOCK_GENERATION_INTERVAL = 60;
Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

if (typeof module !== 'undefined')
    module.exports = Blockchain;

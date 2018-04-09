if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.Block = require('../block/Block');
    global.Wallet = require('../Wallet');
    global.Transaction = require('../transaction/Transaction');
}

class Blockchain extends BaseChain {
    constructor() {
        super();

        this._blocks = [GenesisConfig.GENESIS_BLOCK];

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

    getBlock(hash) {
        for (const block of this._blocks) {
            if (block.hash().equals(hash))
                return block;
        }

        return null;
    }

    getBlockAt(height) {
        return this._blocks[height];
    }

    getBlocks(startBlock, count) {
        let blocks = [];
        for (let i = 0; i <= count; i++) {
            blocks.push(this._blocks[startBlock.height + i]);
        }

        return blocks;
    }

    get difficulty() {
        if (this.head.height % Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && this.head.height > 0) {
            return this.getAdjustedDifficulty();
        }

        return this.head.difficulty;
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

    totalDifficulty(blocks) {
        return blocks.reduce((sum, block) => sum + Math.pow(2, block.difficulty), 0);
    }

    verifyGenesis(block) {
        return block.equals(GenesisConfig.GENESIS_BLOCK);
    }

    verifyBlocks(blocks, unspentTxOuts) {
        //const blockHeight = blocks[0].height;
        //if (blockHeight === 0) {
            if (!this.verifyGenesis(blocks[0]))
                return null;
        /*} else {
            const blocksHeight = blocks[blocks.length - 1].height;
            if (this.height < blocksHeight) {
                if (!Block.verifyNewBlock(blocks[blocksHeight - this.height + 1], this.head))
                    return null;

                blocks = blocks.slice(blocksHeight - this.height + 1);
            }
        }
        */

        //let newUnspentTxOuts = unspentTxOuts.map((tx) => UnspentTransactionOutput.clone(tx));
        let newUnspentTxOuts = Transaction.process(blocks[0].transactions, [], 0);

        for (let i = 1; i < blocks.length; i++) {
            if (!Block.verifyNewBlock(blocks[i], blocks[i - 1])) {
                console.log('invalid block in blockchain');
                return null;
            }

            newUnspentTxOuts = Transaction.process(blocks[i].transactions, newUnspentTxOuts, blocks[i].height);
            if (newUnspentTxOuts === null) {
                console.log('invalid transactions in blockchain');
                return null;
            }
        }

        return newUnspentTxOuts;
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
            this.notify('push-block', newUnspentTxOuts);
            return newUnspentTxOuts;
        }

        return null;
    }

    replaceChain(newBlocks, unspentTxOuts) {
        const blockHeight = newBlocks[0].height;
        if (this.totalDifficulty(newBlocks) <= this.totalDifficulty(this._blocks.slice(blockHeight)))
            return null;

        const newUnspentTxOuts = this.verifyBlocks(newBlocks, unspentTxOuts);
        if (newUnspentTxOuts !== null) {
            const chainHeight = this.height;
            for (let i = 0; i < newBlocks.length; i++) {
                const blockHeight = newBlocks[i].height;
                if (blockHeight <= chainHeight) {
                    this._blocks[blockHeight] = newBlocks[i];
                } else {
                    this._blocks.push(newBlocks[i]);
                }
            }

            return newUnspentTxOuts;
        }

        return null;
    }
}

Blockchain.BLOCK_GENERATION_INTERVAL = 60;
Blockchain.DIFFICULTY_ADJUSTMENT_INTERVAL = 10;

if (typeof module !== 'undefined')
    module.exports = Blockchain;

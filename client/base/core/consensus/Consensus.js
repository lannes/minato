const SyncType = {
    SYNCHRONIZE_STARTED: 0,
    DOWNLOAD_BLOCKCHAIN_FINISHED: 1,
    CONSENSUS_FINISHED: 2,
    DOWNLOAD_TRANSACTION_STARTED: 3,
    DOWNLOAD_TRANSACTION_FINISHED: 4,
    SYNCHRONIZE_COMPLETED: 5
};

class Consensus extends BaseConsensus {
    constructor(blockchain, pool, uTxOPool, node) {
        super(blockchain, pool, uTxOPool);

        this._node = node;
        this.isSync = true;
        this._syncing = false;

        this._blockchain.on('push-block', (unspentTxOuts) => {
            if (unspentTxOuts !== null) {
                this._uTxOPool.update(unspentTxOuts);
                this._mempool.update(unspentTxOuts);

                this._node.broadcast(this._head());
            }
        });
    }

    sendTransaction(address, amount) {
        const tx = Wallet.createTransaction(
            address,
            amount,
            Wallet.privateKey,
            this._uTxOPool.transactions,
            this._mempool.transactions
        );

        this._mempool.add(tx, this._uTxOPool.transactions);
    }

    syncBlockchain() {
        this._syncing = true;

        this._getBlocks();
    }

    _send(message) {
        return message.serialize();
    }

    _getHead() {
        return this._send(new GetHeadMessage());
    }

    _head() {
        const blocks = [this._blockchain.head];
        return this._send(new BlocksMessage(blocks));
    }

    _getBlocks() {
        const locators = this._blockchain.getBlockLocators();
        return this._send(new GetBlocksMessage(locators));
    }

    _blocks(locators) {
        let startBlock = GenesisConfig.GENESIS_BLOCK;
        /*
        for (const locator of locators) {
            const block = this._blockchain.getBlock(locator);
            if (block) {
                startBlock = block;
                break;
            }
        }
        */

        const blocks = this._blockchain.getBlocks(startBlock, this._blockchain.height - startBlock.height);
        return this._send(new BlocksMessage(blocks));
    }

    _getPool() {
        return this._send(new GetPoolMessage());
    }

    _pool() {
        return this._send(new PoolMessage(this._mempool.transactions));
    }

    _addBlocks(blocks) {
        let unspentTxOuts = this._blockchain.replaceChain(blocks, this._uTxOPool.transactions);
        if (unspentTxOuts !== null) {
            this._uTxOPool.update(unspentTxOuts);
            this._mempool.update(unspentTxOuts);

            this._node.broadcast(this._head());
            return true;
        }

        return false;
    }

    _getBalance() {
        return Account.getMyBalance(this._uTxOPool.transactions);
    }

    _checkReceivedBlocks(id, blocks) {
        if (blocks.length === 0) {
            if (this.isSync) {
                this._node.sync({ 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }
            return;
        }

        this.notify('balance', this._getBalance());

        const headReceived = blocks[blocks.length - 1];

        const head = this._blockchain.head;
        if (headReceived.height <= head.height) {
            if (this.isSync) {
                this._node.sync({ 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }

            this.notify('height', this._blockchain.height + 1);
            return;
        }

        if (head.hash().equals(headReceived.prevHash)) {
            this._blockchain.pushBlock(headReceived, this._uTxOPool.transactions);

            if (this.isSync) {
                this._node.sync({ 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': headReceived });
                this.isSync = false;
            }
        } else if (blocks.length === 1) {
            this._node.broadcast(this._getBlocks());

            this.isSync = true;
            this._node.sync({ 'id': id, 'state': SyncType.SYNCHRONIZE_STARTED });
        } else {
            this._node.sync({ 'id': id, 'state': SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED });

            this._addBlocks(blocks);
            this.notify('balance', this._getBalance());

            this._node.sync({ 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_STARTED });
            this._node.broadcast(this._getPool());
        }

        this.notify('height', this._blockchain.height + 1);
    }

    process(id, raw) {
        const buf = new KBuffer(raw);
        const type = MessageFactory.peekType(buf);
        const message = MessageFactory.parse(buf);

        switch (type) {
            case Message.Type.GET_HEAD:
                this._node.send(id, this._head());
                break;
            case Message.Type.GET_BLOCKS: {
                const locators = message.locators;
                this._node.send(id, this._blocks(locators));
                break;
            }
            case Message.Type.BLOCKS: {
                const blocks = message.blocks;
                if (blocks === null)
                    break;

                this._checkReceivedBlocks(id, blocks);
            }
                break;
            case Message.Type.GET_POOL:
                this._node.send(id, this._pool());
                break;
            case Message.Type.POOL: {
                this._node.sync({ 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_FINISHED });

                const transactions = message.transactions;
                if (transactions === null) {
                    console.log('invalid transaction received');
                    return;
                }

                for (let i = 0; i < transactions.length; i++) {
                    try {
                        this._mempool.add(transactions[i], this._uTxOPool.transactions);
                    } catch (e) {
                        console.log(e.message);
                    }
                }

                this._node.sync({ 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
            }
                break;
        }
    }

    start(id) {
        this._node.send(id, this._getHead());
    }

    transfer(address, amount) {
        this.sendTransaction(Address.fromBase64(address), amount);
        this._node.broadcast(this._pool());
    }
}

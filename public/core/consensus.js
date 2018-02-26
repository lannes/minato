const MessageType = {
    QUERY_LATEST: 0,
    QUERY_BLOCKCHAIN: 1,
    RESPONSE_LATEST: 2,
    RESPONSE_BLOCKCHAIN: 3,
    QUERY_TRANSACTION_POOL: 4,
    RESPONSE_TRANSACTION_POOL: 5
};

const SyncType = {
    SYNCHRONIZE_STARTED: 0,
    DOWNLOAD_BLOCKCHAIN_FINISHED: 1,
    CONSENSUS_FINISHED: 2,
    DOWNLOAD_TRANSACTION_STARTED: 3,
    DOWNLOAD_TRANSACTION_FINISHED: 4,
    SYNCHRONIZE_COMPLETED: 5
};

class Consensus extends Observable {
    constructor() {
        super();
        this.isSync = true;
    }

    _responseLatestMsg() {
        return [MessageType.RESPONSE_LATEST, getLatestBlock()];
    }

    _responseBlockchainMsg() {
        return [MessageType.RESPONSE_BLOCKCHAIN, getBlockchain()];
    }

    _responseTransactionPoolMsg() {
        return [MessageType.RESPONSE_TRANSACTION_POOL, getTransactionPool()];
    }

    _queryLatestMsg() {
        return [MessageType.QUERY_LATEST, null];
    }

    _queryBlockchainMsg() {
        return [MessageType.QUERY_BLOCKCHAIN, null];
    }

    _queryTransactionPoolMsg() {
        return [MessageType.QUERY_TRANSACTION_POOL, null];
    }

    async _addBlockchain(blocks) {
        let result = await replaceChain(blocks);
        if (result)
            this.notify('broadcast', this._responseLatestMsg());

        return result;
    }

    async addBlock(block) {
        let result = await addBlockToChain(block);
        if (result)
            this.notify('broadcast', this._responseLatestMsg());

        return result;
    }

    async _checkReceivedBlocks(id, blocks) {
        if (blocks.length === 0) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }
            return;
        }

        const latestBlockReceived = blocks[blocks.length - 1];
        if (!isValidBlockStructure(latestBlockReceived)) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }
            return;
        }

        const latestBlock = getLatestBlock();
        if (latestBlockReceived['index'] <= latestBlock['index']) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }

            if (latestBlockReceived['index'] == latestBlock['index'])
                this.notify('balance', Wallet.getAccountBalance());

            this.notify('height', getLatestBlock()['index'] + 1);
            return;
        }

        if (latestBlock['hash'] === latestBlockReceived['previousHash']) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': latestBlockReceived });
                this.isSync = false;
            }
        } else if (blocks.length === 1) {
            this.notify('broadcast', this._queryBlockchainMsg());

            this.isSync = true;
            this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_STARTED });
        } else {
            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED });

            if (await this._addBlockchain(blocks))
                this.notify('balance', Wallet.getAccountBalance());

            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_STARTED });

            this.notify('broadcast', this._queryTransactionPoolMsg());
        }

        this.notify('height', getLatestBlock()['index'] + 1);
    }

    async process(id, message) {
        switch (message[0]) {
            case MessageType.QUERY_LATEST:
                this.notify('send', [id, this._responseLatestMsg()]);
                break;
            case MessageType.QUERY_BLOCKCHAIN:
                this.notify('send', [id, this._responseBlockchainMsg()]);
                break;
            case MessageType.QUERY_TRANSACTION_POOL:
                this.notify('send', [id, this._responseTransactionPoolMsg()]);
                break;
            case MessageType.RESPONSE_LATEST: {
                const block = message[1];
                if (block === null)
                    break;

                await this._checkReceivedBlocks(id, [block]);
            }
                break;
            case MessageType.RESPONSE_BLOCKCHAIN: {
                const blocks = message[1];
                if (blocks === null)
                    break;

                await this._checkReceivedBlocks(id, blocks);
            }
                break;
            case MessageType.RESPONSE_TRANSACTION_POOL: {
                this.isSync = false;
                this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_FINISHED });

                const receivedTransactions = message[1];
                if (receivedTransactions === null) {
                    console.log('invalid transaction received: %s', JSON.stringify(message[1]));
                    return;
                }

                for (let i = 0; i < receivedTransactions.length; i++) {
                    let transaction = receivedTransactions[i];
                    try {
                        await addToTransactionPool(transaction, getUnspentTxOuts());
                        //this.notify('broadcast', this._responseTransactionPoolMsg());
                    } catch (e) {
                        console.log(e.message);
                    }
                }

                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
            }
                break;
        }
    }

    start(id) {
        this.notify('send', [id, this._queryLatestMsg()]);
    }

    async transfer(account, amount) {
        await sendTransaction(account, amount);
        this.notify('broadcast', this._responseTransactionPoolMsg());
    }
}
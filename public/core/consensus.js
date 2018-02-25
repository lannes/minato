const MessageType = {
    QUERY_LATEST: 0,
    QUERY_BLOCKCHAIN: 1,
    RESPONSE_LATEST: 2,
    RESPONSE_BLOCKCHAIN: 3,
    QUERY_TRANSACTION_POOL: 4,
    RESPONSE_TRANSACTION_POOL: 5
};

const SyncType = {
    DOWNLOAD_BLOCKCHAIN_STARTED: 0,
    DOWNLOAD_BLOCKCHAIN_FINISHED: 1,
    CONSENSUS_FINISHED: 2,
    DOWNLOAD_TRANSACTION_STARTED: 3,
    DOWNLOAD_TRANSACTION_FINISHED: 4,
    SYNCHRONIZE_COMPLETED: 5
};

class Consensus extends Observable {
    constructor() {
        super();
        this.state = 1;
    }

    _responseLatestMsg() {
        return {
            'type': MessageType.RESPONSE_LATEST,
            'data': getLatestBlock()
        };
    }

    _responseBlockchainMsg() {
        return {
            'type': MessageType.RESPONSE_BLOCKCHAIN,
            'data': getBlockchain()
        };
    }

    _responseTransactionPoolMsg() {
        return {
            'type': MessageType.RESPONSE_TRANSACTION_POOL,
            'data': getTransactionPool()
        };
    }

    _queryLatestMsg() {
        return {
            'type': MessageType.QUERY_LATEST,
            'data': null
        }
    }

    _queryBlockchainMsg() {
        return {
            'type': MessageType.QUERY_BLOCKCHAIN,
            'data': null
        };
    }

    _queryTransactionPoolMsg() {
        return {
            'type': MessageType.QUERY_TRANSACTION_POOL,
            'data': null
        };
    }

    async addBlock(block) {
        let result = await addBlockToChain(block);
        if (result)
            this.notify('broadcast', this._responseLatestMsg());

        return result;
    }

    async _addBlockchain(blocks) {
        let result = await replaceChain(blocks);
        if (result)
            this.notify('broadcast', this._responseLatestMsg());

        return result;
    }

    async _checkReceivedBlocks(id, blocks) {
        if (blocks.length === 0) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED });
                this.state = 0;
            }
            return;
        }

        const latestBlockReceived = blocks[blocks.length - 1];
        if (!isValidBlockStructure(latestBlockReceived)) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED });
                this.state = 0;
            }
            return;
        }

        const latestBlock = getLatestBlock();
        if (latestBlockReceived['index'] <= latestBlock['index']) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED });
                this.state = 0;
            }

            if (latestBlockReceived['index'] == latestBlock['index'])
                this.notify('balance', Wallet.getAccountBalance());

            this.notify('block', getLatestBlock()['index'] + 1);
            return;
        }

        if (latestBlock['hash'] === latestBlockReceived['previousHash']) {
            let result = await this.addBlock(latestBlockReceived);

            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED });
                this.state = 0;
            }
        } else if (blocks.length === 1) {
            this.notify('broadcast', this._queryBlockchainMsg());

            this.state = 1;
            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_BLOCKCHAIN_STARTED });
        } else {
            this.state = 0;

            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED });

            if (await this._addBlockchain(blocks))
                this.notify('balance', Wallet.getAccountBalance());

            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_STARTED });

            this.notify('broadcast', this._queryTransactionPoolMsg());
        }

        this.notify('block', getLatestBlock()['index'] + 1);
    }

    async messageHandler(id, message) {
        switch (message['type']) {
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
                const block = message['data'];
                if (block === null)
                    break;

                await this._checkReceivedBlocks(id, [block]);
            }
                break;
            case MessageType.RESPONSE_BLOCKCHAIN: {
                const blocks = message['data'];
                if (blocks === null)
                    break;

                await this._checkReceivedBlocks(id, blocks);
            }
                break;
            case MessageType.RESPONSE_TRANSACTION_POOL: {
                this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_FINISHED });

                const receivedTransactions = message['data'];
                if (receivedTransactions === null) {
                    console.log('invalid transaction received: %s', JSON.stringify(message['data']));
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

                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED });
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
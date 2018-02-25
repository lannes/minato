const MessageType = {
    QUERY_LATEST: 0,
    QUERY_BLOCKCHAIN: 1,
    RESPONSE_LATEST: 2,
    RESPONSE_BLOCKCHAIN: 3,
    QUERY_TRANSACTION_POOL: 4,
    RESPONSE_TRANSACTION_POOL: 5
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

    async addBlock(newBlock) {
        let result = await addBlockToChain(newBlock);
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

    async _checkReceivedBlocks(id, receivedBlocks) {
        if (receivedBlocks.length === 0) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': 5 });
                this.state = 0;
            }
            return;
        }

        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        if (!isValidBlockStructure(latestBlockReceived)) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': 5 });
                this.state = 0;
            }
            return;
        }

        const latestBlock = getLatestBlock();
        if (latestBlockReceived['index'] <= latestBlock['index']) {
            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': 5 });
                this.state = 0;
            }

            this.notify('block', getLatestBlock()['index'] + 1);
            return;
        }

        if (latestBlock['hash'] === latestBlockReceived['previousHash']) {
            let result = await this.addBlock(latestBlockReceived);

            if (this.state === 1) {
                this.notify('sync', { 'id': id, 'state': 5 });
                this.state = 0;
            }
        } else if (receivedBlocks.length === 1) {
            this.notify('broadcast', this._queryBlockchainMsg());

            this.state = 1;
            this.notify('sync', { 'id': id, 'state': 0 });
        } else {
            this.state = 0;

            this.notify('sync', { 'id': id, 'state': 1 });

            await this._addBlockchain(receivedBlocks);

            this.notify('sync', { 'id': id, 'state': 3 });

            this.notify('broadcast', this._queryTransactionPoolMsg());
        }

        this.notify('block', getLatestBlock()['index'] + 1);
    }

    async messageHandler(id, message) {
        switch (message['type']) {
            case MessageType.QUERY_LATEST:
                this.notify('p2p', [id, this._responseLatestMsg()]);
                break;
            case MessageType.QUERY_BLOCKCHAIN:
                this.notify('p2p', [id, this._responseBlockchainMsg()]);
                break;
            case MessageType.QUERY_TRANSACTION_POOL:
                this.notify('p2p', [id, this._responseTransactionPoolMsg()]);
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
                this.notify('sync', { 'id': id, 'state': 4 });

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

                this.notify('sync', { 'id': id, 'state': 5 });
            }
                break;
        }
    }

    start(id) {
        this.notify('p2p', [id, this._queryLatestMsg()]);
    }

    async transfer(account, amount) {
        await sendTransaction(account, amount);
        this.notify('broadcast', this._responseTransactionPoolMsg());
    }
}
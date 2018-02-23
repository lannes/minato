const MessageType = {
    QUERY_LATEST: 0,
    QUERY_BLOCKCHAIN: 1,
    RESPONSE_LATEST: 2,
    RESPONSE_BLOCKCHAIN: 3,
    QUERY_TRANSACTION_POOL: 4,
    RESPONSE_TRANSACTION_POOL: 5
};

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_LATEST,
    'data': getLatestBlock()
});

const responseBlockchainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': getBlockchain()
});

const responseTransactionPoolMsg = () => ({
    'type': MessageType.RESPONSE_TRANSACTION_POOL,
    'data': getTransactionPool()
});

const queryLatestMsg = () => ({
    'type': MessageType.QUERY_LATEST,
    'data': null
});

const queryBlockchainMsg = () => ({
    'type': MessageType.QUERY_BLOCKCHAIN,
    'data': null
});

const queryTransactionPoolMsg = () => ({
    'type': MessageType.QUERY_TRANSACTION_POOL,
    'data': null
});

class Consensus extends Observable {
    constructor() {
        super();
        this.state = 1;
    }

    async checkReceivedBlocks(id, receivedBlocks) {
        if (receivedBlocks.length === 0) {
            if (this.state === 1) {
                this.notify('download', { 'id': id, 'state': 1 });
                this.state = 0;
            }
            return;
        }

        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        if (!isValidBlockStructure(latestBlockReceived)) {
            if (this.state === 1) {
                this.notify('download', { 'id': id, 'state': 1 });
                this.state = 0;
            }
            return;
        }

        const latestBlock = getLatestBlock();
        if (latestBlockReceived['index'] <= latestBlock['index']) {
            if (this.state === 1) {
                this.notify('download', { 'id': id, 'state': 1 });
                this.state = 0;
            }
            return;
        }

        if (latestBlock['hash'] === latestBlockReceived['previousHash']) {
            if (await addBlockToChain(latestBlockReceived)) {
                this.notify('broadcast', responseLatestMsg());
            }

            if (this.state === 1) {
                this.notify('download', { 'id': id, 'state': 1 });
                this.state = 0;
            }
        } else if (receivedBlocks.length === 1) {
            this.notify('broadcast', queryBlockchainMsg());

            this.state = 1;
            this.notify('download', { 'id': id, 'state': 0 });
        } else {
            if (await replaceChain(receivedBlocks)) {
                this.notify('broadcast', responseLatestMsg());
            }

            this.notify('download', { 'id': id, 'state': 1 });
            this.state = 0;
        }

        this.notify('block', getLatestBlock()['index'] + 1);
    }

    async messageHandler(id, message) {
        switch (message['type']) {
            case MessageType.QUERY_LATEST:
                this.notify('p2p', [id, responseLatestMsg()]);
                break;
            case MessageType.QUERY_BLOCKCHAIN:
                this.notify('p2p', [id, responseBlockchainMsg()]);
                break;
            case MessageType.QUERY_TRANSACTION_POOL:
                this.notify('p2p', [id, responseTransactionPoolMsg()]);
                break;
            case MessageType.RESPONSE_LATEST: {
                const latestBlockReceived = message['data'];
                if (latestBlockReceived === null)
                    break;

                await this.checkReceivedBlocks(id, [latestBlockReceived]);
            }
                break;
            case MessageType.RESPONSE_BLOCKCHAIN: {
                const receivedBlocks = message['data'];
                if (receivedBlocks === null)
                    break;

                await this.checkReceivedBlocks(id, receivedBlocks);
            }
                break;
            case MessageType.RESPONSE_TRANSACTION_POOL:
                const receivedTransactions = message['data'];
                if (receivedTransactions === null) {
                    console.log('invalid transaction received: %s', JSON.stringify(message['data']));
                    break;
                }

                for (let i = 0; i < receivedTransactions.length; i++) {
                    let transaction = receivedTransactions[i];
                    try {
                        await handleReceivedTransaction(transaction);
                        // if no error is thrown, transaction was indeed added to the pool
                        // let's broadcast transaction pool
                        //broadcast(responseTransactionPoolMsg());
                    } catch (e) {
                        console.log(e.message);
                    }
                }
                break;
        }
    }
}
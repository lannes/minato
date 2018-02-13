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

const broadcast = (message) => {
    this.postMessage({ 'cmd': 'p2p', 'msg': [message] });
};

let state = MessageType.QUERY_LATEST;

const messageHandler = async (id, message) => {
    switch (message['type']) {
        case MessageType.QUERY_LATEST:
            this.postMessage({ 'cmd': 'p2p', 'msg': [id, responseLatestMsg()] });
            break;
        case MessageType.QUERY_BLOCKCHAIN:
            this.postMessage({ 'cmd': 'p2p', 'msg': [id, responseBlockchainMsg()] });
            break;
        case MessageType.QUERY_TRANSACTION_POOL:
            this.postMessage({ 'cmd': 'p2p', 'msg': [id, responseTransactionPoolMsg()] });
            break;
        case MessageType.RESPONSE_LATEST: {
            if (state == MessageType.QUERY_BLOCKCHAIN)
                return;

            const latestBlockReceived = message['data'];
            if (latestBlockReceived === null)
                break;

            if (!isValidBlockStructure(latestBlockReceived)) {
                return;
            }

            const latestBlock = getLatestBlock();
            if (latestBlockReceived['index'] > latestBlock['index']) {
                if (latestBlock['hash'] === latestBlockReceived['previousHash']) {
                    if (await addBlockToChain(latestBlockReceived)) {
                        broadcast(responseLatestMsg());
                    }
                } else {
                    state = MessageType.QUERY_BLOCKCHAIN;                    
                    broadcast(queryBlockchainMsg());
                    this.postMessage({ 'cmd': 'download', 'msg': { 'id': id, 'state': 0 } });
                }

                this.postMessage({ 'cmd': 'block', 'msg': getLatestBlock()['index'] + 1 });
            }
        }
            break;
        case MessageType.RESPONSE_BLOCKCHAIN: {
            const receivedBlocks = message['data'];
            if (receivedBlocks === null)
                break;

            if (receivedBlocks.length === 0)
                return;

            const latestBlock = getLatestBlock();
            const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];

            if (latestBlockReceived['index'] > latestBlock['index']) {
                if (await consensus(receivedBlocks)) {
                    broadcast(responseLatestMsg());
                }

                state = MessageType.QUERY_LATEST;
                
                this.postMessage({ 'cmd': 'download', 'msg': { 'id': id, 'state': 1 } });
                this.postMessage({ 'cmd': 'block', 'msg': getLatestBlock()['index'] + 1 });
            }
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

const MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_TRANSACTION_POOL: 3,
    RESPONSE_TRANSACTION_POOL: 4
};

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': [getLatestBlock()]
});

const responseAllMsg = () => ({
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

const queryAllMsg = () => ({
    'type': MessageType.QUERY_ALL,
    'data': null
});

const queryTransactionPoolMsg = () => ({
    'type': MessageType.QUERY_TRANSACTION_POOL,
    'data': null
});

const broadcast = (message) => {
    this.postMessage({ 'cmd': 'p2p', 'msg': message });
};

const handleBlockchainResponse = async (receivedBlocks) => {
    console.log('received block chain size: ' + receivedBlocks.length);

    if (receivedBlocks.length === 0)
        return;

    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('block structuture not valid');
        return;
    }

    const latestBlock = getLatestBlock();
    if (latestBlockReceived.index > latestBlock.index) {
        console.log('current block: ' + latestBlock.index + ' receive: ' + latestBlockReceived.index);
        if (latestBlock.hash === latestBlockReceived.previousHash) {
            if (await addBlockToChain(latestBlockReceived)) {
                broadcast(responseLatestMsg());
            }
        } else if (receivedBlocks.length === 1) {
            broadcast(queryAllMsg());
        } else {
            console.log('Received blockchain is longer than current blockchain');
            if (await replaceChain(receivedBlocks))
                broadcast(responseLatestMsg());
        }
    } else {
        console.log('received blockchain is not longer than received blockchain. Do nothing');
    }
}

const messageHandler = async (id, message) => {
    switch (message['type']) {
        case MessageType.QUERY_LATEST:
            this.postMessage({ 'cmd': 'p2p', 'id': id, 'msg': responseLatestMsg() });
            break;
        case MessageType.QUERY_ALL:
            this.postMessage({ 'cmd': 'p2p', 'id': id, 'msg': responseAllMsg() });
            break;
        case MessageType.QUERY_TRANSACTION_POOL:
            this.postMessage({ 'cmd': 'p2p', 'id': id, 'msg': responseTransactionPoolMsg() });
            break;
        case MessageType.RESPONSE_BLOCKCHAIN:
            const receivedBlocks = message['data'];
            if (receivedBlocks === null) {
                console.log('invalid blocks received: %s', JSON.stringify(message['data']));
                break;
            }

            await handleBlockchainResponse(receivedBlocks);
            break;
        case MessageType.RESPONSE_TRANSACTION_POOL:
            const receivedTransactions = message['data'];
            if (receivedTransactions === null) {
                console.log('invalid transaction received: %s', JSON.stringify(message['data']));
                break;
            }

            for (let i = 0; receivedTransactions.length; i++) {
                let transaction = receivedTransactions[i];
                try {
                    await handleReceivedTransaction(transaction);
                    // if no error is thrown, transaction was indeed added to the pool
                    // let's broadcast transaction pool
                    broadcast(responseTransactionPoolMsg());
                } catch (e) {
                    console.log(e.message);
                }
            }
            break;
    }
}

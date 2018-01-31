const MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2,
    QUERY_TRANSACTION_POOL: 3,
    RESPONSE_TRANSACTION_POOL: 4
};

const responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify(getBlockchain())
});

const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

const responseTransactionPoolMsg = () => ({
    'type': MessageType.RESPONSE_TRANSACTION_POOL,
    'data': JSON.stringify(getTransactionPool())
});

const initMessageHandler = (id, message) => {
    switch (message['type']) {
        case MessageType.QUERY_LATEST:
            this.postMessage({ 'cmd': 'p2p', 'id': id, 'msg': responseLatestMsg() });
            break;
        case MessageType.QUERY_ALL:
            this.postMessage({ 'cmd': 'p2p', 'id': id, 'msg': responseChainMsg() });
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

            handleBlockchainResponse(receivedBlocks);
            break;
        case MessageType.RESPONSE_TRANSACTION_POOL:
            const receivedTransactions = message.data;
            if (receivedTransactions === null) {
                console.log('invalid transaction received: %s', JSON.stringify(message.data));
                break;
            }

            receivedTransactions.forEach((transaction) => {
                try {
                    handleReceivedTransaction(transaction);
                    // if no error is thrown, transaction was indeed added to the pool
                    // let's broadcast transaction pool
                    broadCastTransactionPool();
                } catch (e) {
                    console.log(e.message);
                }
            });
            break;
    }
}

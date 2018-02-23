importScripts(
    '../util/common.js',
    '../util/db.js',
    '../util/hash.js',
    '../util/crypto.js',
    '../util/observable.js'
);

importScripts(
    './wallet.js',
    './transaction/tx.js',
    './transaction/txPool.js',
    './block.js',
    './blockchain.js',
    './consensus.js'
);

let nodePort = null;
let consensus = new Consensus();

consensus.on('download', async (data) => {
    if (data['state'] === 1) {
        const newBlock = await generateNextBlock();
        nodePort.postMessage({ 'cmd': 'mine', 'msg': newBlock });
    } else {
        nodePort.postMessage({ 'cmd': 'pause' });
    }

    self.postMessage({ 'cmd': 'download', 'msg': data });
});

const broadcast = (message) => {
    this.postMessage({ 'cmd': 'p2p', 'msg': [message] });
};

consensus.on('block', (block) => this.postMessage({ 'cmd': 'block', 'msg': block }));
consensus.on('p2p', (data) => this.postMessage({ 'cmd': 'p2p', 'msg': data }));
consensus.on('broadcast', (data) => broadcast(data));

const init = async () => {
    console.log('MINATO VERSION 0.0.1');

    await Database.open('hokage4', 1, () => {
        Database.createStore('blockchain', 'index');
        Database.createStore('transaction', 'id');
        Database.createStore('wallet');
    });

    await Wallet.initWallet();

    await initBlockchain();

    this.postMessage({ 'cmd': 'init', 'msg': Wallet.getPublicFromWallet() });
};

const generateNextBlock = async () => {
    const address = Wallet.getPublicFromWallet();
    const coinbaseTx = await getCoinbaseTransaction(address, getLatestBlock()['index'] + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());

    const previousBlock = getLatestBlock();

    let block = {
        'index': previousBlock['index'] + 1,
        'hash': '',
        'previousHash': previousBlock['hash'],
        'timestamp': getCurrentTimestamp(),
        'data': blockData,
        'difficulty': getDifficulty(getBlockchain()),
        'nonce': 0
    };

    return block;
};

const onMessageFromMiner = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'block': {
            // generate Raw Next Block
            let block = data['msg'];
            if (await addBlockToChain(block)) {
                broadcast(responseLatestMsg());
            }

            const newBlock = await generateNextBlock();
            nodePort.postMessage({ 'cmd': 'mine', 'msg': newBlock });
        }
            break;
        case 'hashrate':
            this.postMessage(data);
            break;
        default:
            break;
    }
};

this.onmessage = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'connect':
            nodePort = event.ports[0];
            nodePort.onmessage = onMessageFromMiner;
            break;
        case 'init':
            await init();
            break;
        case 'mine':
        case 'pause':
            nodePort.postMessage(data);
            break;
        case 'sendTransaction':
            await sendTransaction(data['address'], data['amount']);
            broadcast(responseTransactionPoolMsg());
            break;
        case 'p2p':
            switch (data['type']) {
                case 'open':
                    this.postMessage({ 'cmd': 'p2p', 'msg': [data['id'], queryLatestMsg()] });

                    setTimeout(() => {
                        broadcast(queryTransactionPoolMsg());
                    }, 500);
                    break;
                case 'data':
                    await consensus.messageHandler(data['id'], data['msg']);
                    break;
            }
            break;
        default:
            console.log(data);
            break;
    }
}

this.onerror = (e) => {
    console.log(e.message + " (" + e.filename + ":" + e.lineno + ")");
}

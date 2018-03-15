importScripts(
    '../util/common.js',
    '../util/db.js',
    '../util/hash.js',
    '../util/crypto.js',
    '../util/observable.js',
    '../util/scheduler.js'
);

importScripts(
    './wallet.js?v=0.1',
    './transaction/tx.js?v=0.1',
    './transaction/txPool.js?v=0.1',
    './block.js?v=0.1',
    './blockchain.js?v=0.1',
    './consensus.js?v=0.1'
);

let nodePort = null;
let consensus = new Consensus();

let scheduler = new SchedulerAsync();

const mine = (block) => {
    scheduler.addJob(async () => {
        if (block)
            await consensus.addBlock(block);

        const newBlock = await generateNextBlock();
        nodePort.postMessage({ 'cmd': 'mine', 'msg': newBlock });
    });
};

consensus.on('sync', async (data) => {
    switch (data['state']) {
        case SyncType.SYNCHRONIZE_STARTED:
            nodePort.postMessage({ 'cmd': 'pause' });
            break;
        case SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED:
            break;
        case SyncType.CONSENSUS_FINISHED:
            break;
        case SyncType.DOWNLOAD_TRANSACTION_STARTED:
            break;
        case SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED:
            break;
        case SyncType.SYNCHRONIZE_COMPLETED:
            mine(data['block']);
            break;
    }

    self.postMessage({ 'cmd': 'sync', 'msg': data });
});

consensus.on('balance', (balance) => this.postMessage({ 'cmd': 'balance', 'msg': Wallet.getAccountBalance() }));
consensus.on('height', (height) => this.postMessage({ 'cmd': 'height', 'msg': height }));
consensus.on('send', (data) => this.postMessage({ 'cmd': 'network', 'msg': data }));
consensus.on('broadcast', (data) => this.postMessage({ 'cmd': 'network', 'msg': [0, data] }));

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

    scheduler.start();
};

const generateNextBlock = async () => {
    const address = Wallet.getPublicFromWallet();
    const coinbaseTx = await getCoinbaseTransaction(address, getLatestBlock()['index'] + 1);
    const blockData = [coinbaseTx].concat(getTransactionPool());

    const latestBlock = getLatestBlock();

    let block = {
        'index': latestBlock['index'] + 1,
        'hash': '',
        'previousHash': latestBlock['hash'],
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
        case 'block':
            mine(data['msg']);
            break;
        case 'hashrate':
            this.postMessage(data);
            break;
        case 'state':
            
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
            await consensus.transfer(data['address'], data['amount']);
            break;
        case 'network':
            switch (data['type']) {
                case 'open':
                    consensus.start(data['id']);
                    break;
                case 'data':
                    await consensus.process(data['id'], data['msg']);
                    break;
            }
            break;
        case 'stop':
            this.close();
            break;
        default:
            console.log(data);
            break;
    }
}

this.onerror = (e) => {
    console.log(e.message + " (" + e.filename + ":" + e.lineno + ")");
}

importScripts(
    './crypto/sjcl.js?v=0.1',
    './crypto/hash.js?v=0.1',
    './crypto/elliptic.min.js?v=0.1',
    '../base/crypto/elliptic.js?v=0.1',
    '../base/util/common.js?v=0.1',
    '../base/util/db.js?v=0.1',
    '../base/util/buffer.js?v=0.1',
    '../base/util/observable.js?v=0.1',
    '../base/util/scheduler.js?v=0.1',
    '../base/core/transaction/tx.js?v=0.1',
    '../base/core/transaction/txPool.js?v=0.1',
    '../base/core/block.js?v=0.1',
    '../base/core/blockchain.js?v=0.1',
    '../base/core/consensus.js?v=0.1',
    '../base/core/wallet.js?v=0.1'
);

let nodePort = null;

let pool = new TransactionPool();
let blockchain = new Blockchain(pool);
let consensus = new Consensus(pool, blockchain);

let scheduler = new SchedulerAsync();

const mine = (block) => {
    scheduler.addJob(() => {
        if (block)
            consensus.addBlock(block);

        const newBlock = generateNextBlock();
        nodePort.postMessage({ 'cmd': 'mine', 'msg': newBlock });
    });
};

consensus.on('sync', (data) => {
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

    await Database.delete('hokage4');
    await Database.open('hokage', 1, () => {
        Database.createStore('blockchain', 'index');
        Database.createStore('transaction', 'id');
        Database.createStore('wallet');
    });

    await Wallet.initWallet();

    blockchain.init();

    this.postMessage({ 'cmd': 'init', 'msg': Wallet.getPublicFromWallet() });

    scheduler.start();
};

const generateNextBlock = () => {
    const address = Wallet.getPublicFromWallet();
    const coinbaseTx = Transaction.getCoinbaseTransaction(address, blockchain.getLatestBlock()['index'] + 1);
    const blockData = [coinbaseTx].concat(pool.getTransactionPool());

    const latestBlock = blockchain.getLatestBlock();

    let block = {
        'index': latestBlock['index'] + 1,
        'hash': '',
        'previousHash': latestBlock['hash'],
        'timestamp': getCurrentTimestamp(),
        'data': blockData,
        'difficulty': blockchain.getDifficulty(blockchain.getBlocks()),
        'nonce': 0
    };

    return block;
};

const onMessageFromMiner = (event) => {
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
            consensus.transfer(data['address'], data['amount']);
            break;
        case 'network':
            switch (data['type']) {
                case 'open':
                    consensus.start(data['id']);
                    break;
                case 'data':
                    consensus.process(data['id'], data['msg']);
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

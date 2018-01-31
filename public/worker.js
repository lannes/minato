importScripts(
    './util/common.js',
    './util/db.js',
    './util/hash.js',
    './util/elliptic.js'
);

importScripts(
    './core/wallet.js',
    './core/transaction/tx.js',
    './core/transaction/txPool.js',
    './core/block.js',
    './core/blockchain.js',
    './core/p2p.js'
);

const init = async () => {
    console.log('MINATO VERSION 0.0.1');

    await Database.open('hokage4', 1, () => {
        Database.createStore('blockchain', 'index');
        Database.createStore('transaction', 'id');
        Database.createStore('wallet');
    });

    await Wallet.initWallet();

    await initBlockchain();

    this.postMessage({ 'cmd': 'init', 'msg': 'success' });
};

const mining = async () => {
    const newBlock = await generateNextBlock();
    if (newBlock === null) {
        console.log('could not generate block');
    } else {
        //broadcastLatest();
        this.postMessage({ 'code': 1, 'msg': newBlock });
    }
};

self.onmessage = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'init':
            (async () => {
                await init();
            })().catch((e) => {
                console.log(e);
            });
            break;
        case 'p2p':
            //data['msg'];
            break;
        default:
            this.postMessage({ 'code': -100, 'msg': 'invalid command' });
    }
}
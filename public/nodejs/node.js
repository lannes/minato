process.on('uncaughtException', (err) => {
    const message = err.message;
    if (message &&
        (message.startsWith('connect E') ||
            message === 'Cannot read property \'aborted\' of null'))
        return;

    console.error(`Uncaught exception: ${message || err}`, err);
});

const Observable = require('../base/util/observable');
const SchedulerAsync = require('../base/util/scheduler');

const TransactionPool = require('../base/core/transaction/txPool');
const Blockchain = require('../base/core/blockchain');
const Consensus = require('../base/core/consensus');
const Wallet = require('../base/core/wallet');
const KDatabase = require('./util/db');

let scheduler = new SchedulerAsync();

let pool = new TransactionPool();
let blockchain = new Blockchain(pool);
let consensus = new Consensus(pool, blockchain);

const init = async () => {
    console.log('MINATO VERSION 0.0.2');

    KDatabase.open('hokage');

    await Wallet.initWallet();
    
    blockchain.init();
    scheduler.start();
};

(async () => {
    await init();
})();

const Observable = require('../base/util/observable');
const SchedulerAsync = require('../base/util/scheduler');

const TransactionPool = require('../base/core/transaction/txPool');
const Blockchain = require('../base/core/blockchain');
const Consensus = require('../base/core/consensus');
const Wallet = require('../base/core/wallet');

const KHash = require('./crypto/hash');

let scheduler = new SchedulerAsync();

let pool = new TransactionPool();
let blockchain = new Blockchain(pool);
let consensus = new Consensus(pool, blockchain);

const init = async () => {
    console.log('MINATO VERSION 0.0.1');


    /*
    await Database.open('hokage4', 1, () => {
        Database.createStore('blockchain', 'index');
        Database.createStore('transaction', 'id');
        Database.createStore('wallet');
    });

    await Wallet.initWallet();

    await blockchain.init();
*/

    scheduler.start();
};

let x = KHash.sha256('123');
console.log(x);



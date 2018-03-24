const Observable = require('../base/util/observable');
const SchedulerAsync = require('../base/util/scheduler');

const TransactionPool = require('../base/core/transaction/txPool');
const Blockchain = require('../base/core/blockchain');
const Consensus = require('../base/core/consensus');
const Wallet = require('../base/core/wallet');

const KElliptic = require('../base/crypto/elliptic');

let scheduler = new SchedulerAsync();

let pool = new TransactionPool();
let blockchain = new Blockchain(pool);
let consensus = new Consensus(pool, blockchain);

const init = async () => {
    console.log('MINATO VERSION 0.0.1');

    /*
    await Database.open('hokage', 1, () => {
        Database.createStore('blockchain', 'index');
        Database.createStore('transaction', 'id');
        Database.createStore('wallet');
    });

    await Wallet.initWallet();

    blockchain.init();
*/

    scheduler.start();
};

const keyPair = KElliptic.generateKeyPair();
const privateData = KElliptic.generatePrivateData(keyPair.private);
const publicData = KElliptic.generatePublicData(keyPair.public);

console.log(privateData);
console.log(publicData);

const privateKey = KElliptic.importPrivateKey(privateData);
const publicKey = KElliptic.importPublicKey(publicData);

const data = KElliptic.sign(privateKey, 'sdwdwdwdw');
console.log(KElliptic.verify(publicKey, data, 'sdwdwdwdw'));
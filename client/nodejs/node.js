process.on('uncaughtException', (err) => {
    const message = err.message;
    if (message &&
        (message.startsWith('connect E') ||
            message === 'Cannot read property \'aborted\' of null'))
        return;

    console.error(`Uncaught exception: ${message || err}`, err);
});

const SchedulerAsync = require('../base/util/scheduler');

const TransactionPool = require('../base/core/transaction/txPool');
const Blockchain = require('../base/core/blockchain');
const Consensus = require('../base/core/consensus');
const Wallet = require('../base/core/wallet');
const KDatabase = require('./util/db');

class KNode {
    constructor() {
        this.scheduler = new SchedulerAsync();

        this.pool = new TransactionPool();
        this.blockchain = new Blockchain(this.pool);
        this.consensus = new Consensus(this.pool, this.blockchain);

        this.consensus.on('sync', (data) => {
            switch (data['state']) {
                case SyncType.SYNCHRONIZE_STARTED:
                    // pause mining
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
                    this.mine(data['block']);
                    break;
            }

            this._send({
                'cmd': 'sync', 'msg': data
            });
        });

        this.consensus.on('send', (data) => this._send({
            'cmd': 'network', 'msg': data
        }));

        this.consensus.on('broadcast', (data) => this._send({
            'cmd': 'network', 'msg': [0, data]
        }));
    }

    _send(message) {

    }

    async _init() {
        console.log('MINATO VERSION 0.0.2');

        KDatabase.open('hokage');

        await Wallet.initWallet();

        this.blockchain.init();
        this.scheduler.start();
    }

    _generateNextBlock() {
        const address = Wallet.getPublicFromWallet();
        const latestBlock = this.blockchain.getLatestBlock();

        const coinbaseTx = Transaction.getCoinbaseTransaction(address, latestBlock['index'] + 1);
        const blockData = [coinbaseTx].concat(this.pool.getTransactionPool());

        let block = {
            'index': latestBlock['index'] + 1,
            'hash': '',
            'previousHash': latestBlock['hash'],
            'timestamp': getCurrentTimestamp(),
            'data': blockData,
            'difficulty': this.blockchain.getDifficulty(this.blockchain.getBlocks()),
            'nonce': 0
        };

        return block;
    }

    _mine(block) {
        this.scheduler.addJob(() => {
            if (block)
                this.consensus.addBlock(block);

            const newBlock = this._generateNextBlock();
            nodePort.postMessage({ 'cmd': 'mine', 'msg': newBlock });
        });
    }

}

module.exports = KNode;
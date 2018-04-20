const Blockchain = require('../base/core/blockchain/Blockchain');
const TransactionPool = require('../base/core/transaction/TransactionPool');
const UnspentTransactionOutputPool = require('../base/core/transaction/UnspentTransactionOutputPool');
const Consensus = require('../base/core/consensus/Consensus');
const Miner = require('../base/core/miner/Miner');
const Wallet = require('../base/core/account/Wallet');
const KDatabase = require('./utils/Database');

class Node {
    constructor(network) {
        this._network = network;

        this._blockchain = new Blockchain();
        this._pool = new TransactionPool();
        this._uTxOPool = new UnspentTransactionOutputPool();

        this._consensus = new Consensus(this._blockchain, this._pool, this._uTxOPool, this);

        this._miner = new Miner(this._blockchain, this._pool, this._uTxOPool);

        this._miner.on('hashrate', (value) => this._send({
            'cmd': 'hashrate', 'msg': value
        }));
    }

    sync(data) {
        switch (data['state']) {
            case SyncType.SYNCHRONIZE_STARTED:
                console.log('SYNCHRONIZE_STARTED');
                this._miner.stopWork();
                break;
            case SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED:
                console.log('DOWNLOAD_BLOCKCHAIN_FINISHED');
                break;
            case SyncType.CONSENSUS_FINISHED:
                console.log('CONSENSUS_FINISHED');
                break;
            case SyncType.DOWNLOAD_TRANSACTION_STARTED:
                console.log('DOWNLOAD_TRANSACTION_STARTED');
                break;
            case SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED:
                console.log('DOWNLOAD_BLOCKCHAIN_FINISHED');
                break;
            case SyncType.SYNCHRONIZE_COMPLETED:
                console.log('SYNCHRONIZE_COMPLETED');
                this._miner.startWork();
                break;
        }

        this._send({
            'cmd': 'sync', 'msg': data
        });
    }

    postMessage(type, data) {
        this._send({
            'cmd': type, 'msg': data
        });
    }

    broadcast(data) {
        this._send({
            'cmd': 'network', 'msg': [0, data]
        });
    }

    send(id, data) {
        this._send({
            'cmd': 'network', 'msg': [id, data]
        });
    }

    _send(data) {
        if (data['cmd'] !== 'network')
            return;

        if (data['msg'].length !== 2)
            return;

        const id = data['msg'][0];
        const msg = data['msg'][1];
        if (id === 0)
            this._network.broadcast(msg);
        else
            this._network.send(id, msg);
    }

    async _init() {
        console.log('MINATO VERSION 0.0.2');

        await KDatabase.open('hokage4', 1, () => {
            KDatabase.createStore('blockchain', 'index');
            KDatabase.createStore('transaction', 'id');
            KDatabase.createStore('wallet');
        });

        await Wallet.init();
    }

    async onmessage(data) {
        switch (data['cmd']) {
            case 'init':
                await this._init();
                break;
            case 'state':
                break;
            case 'mine':
            case 'pause':
                break;
            case 'sendTransaction':
                this._consensus.transfer(data['address'], data['amount']);
                break;
            case 'network':
                switch (data['type']) {
                    case 'open':
                        this._consensus.start(data['id']);
                        break;
                    case 'data':
                        this._consensus.process(data['id'], data['msg']);
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

}

module.exports = Node;
importScripts(
    '../crypto/sha256.js?v=0.1',
    '../crypto/hash.js?v=0.1',
    '../crypto/axlsign.js?v=0.1',
    '../../base/crypto/elliptic.js?v=0.1',
    '../../base/util/common.js?v=0.1',
    '../../base/util/db.js?v=0.1',
    '../../base/util/StringUtils.js?v=0.1',
    '../../base/util/NumberUtils.js?v=0.1',
    '../../base/util/ArrayUtils.js?v=0.1',
    '../../base/util/Buffer.js?v=0.2',
    '../../base/util/Observable.js?v=0.2',
    '../../base/util/Synchronizer.js?v=0.1',
    '../../base/core/common/Signature.js?v=0.1',
    '../../base/core/common/Address.js?v=0.1',
    '../../base/core/common/Hash.js?v=0.1',
    '../../base/core/transaction/TransactionInput.js?v=0.1',
    '../../base/core/transaction/TransactionOutput.js?v=0.1',
    '../../base/core/transaction/UnspentTransactionOutput.js?v=0.1',
    '../../base/core/transaction/UnspentTransactionOutputPool.js?v=0.1',
    '../../base/core/transaction/Transaction.js?v=0.2',
    '../../base/core/transaction/TransactionPool.js?v=0.2',
    '../../base/core/block/BlockBody.js?v=0.1',
    '../../base/core/block/BlockHeader.js?v=0.1',
    '../../base/core/block/Block.js?v=0.1',
    '../../base/core/block/BlockUtils.js?v=0.1',
    '../../base/core/blockchain/BaseChain.js?v=0.1',
    '../../base/core/blockchain/Blockchain.js?v=0.2',
    '../../base/network/message/Message.js?v=0.1',
    '../../base/network/message/GetHeadMessage.js?v=0.1',
    '../../base/network/message/GetBlocksMessage.js?v=0.1',
    '../../base/network/message/BlocksMessage.js?v=0.1',
    '../../base/network/message/GetPoolMessage.js?v=0.1',
    '../../base/network/message/PoolMessage.js?v=0.1',
    '../../base/network/message/MessageFactory.js?v=0.1',
    '../../base/core/account/Account.js?v=0.1',
    '../../base/core/consensus/GenesisConfig.js?v=0.1',
    '../../base/core/consensus/BaseConsensus.js?v=0.1',
    '../../base/core/consensus/Consensus.js?v=0.1',
    '../../base/core/miner/MinerWorkerImpl.js?v=0.1',
    '../../base/core/miner/MinerWorker.js?v=0.1',
    '../../base/core/miner/Miner.js?v=0.1',
    '../../base/core/Wallet.js?v=0.2'
);

class KNodeWorker {
    constructor() {
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

    _send(message) {
        self.postMessage(message);
    }

    async _init() {
        console.log('MINATO VERSION 0.0.2');

        await KDatabase.open('hokage4', 1, () => {
            KDatabase.createStore('blockchain', 'index');
            KDatabase.createStore('transaction', 'id');
            KDatabase.createStore('wallet');
        });

        await Wallet.initWallet();

        this._send({
            'cmd': 'init', 'msg': Wallet.getPublicFromWallet().base64
        });
    }

    async onmessage(event) {
        const data = event.data;
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

const nodeWorker = new KNodeWorker();
self.onmessage = async (event) => {
    await nodeWorker.onmessage(event);
}

self.onerror = (e) => {
    console.log(e.message + " (" + e.filename + ":" + e.lineno + ")");
}

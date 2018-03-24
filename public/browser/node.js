importScripts(
    './crypto/sjcl.js?v=0.1',
    './crypto/hash.js?v=0.1',
    './crypto/elliptic.min.js?v=0.1',
    '../base/crypto/elliptic.js?v=0.1',
    '../base/util/common.js?v=0.1',
    '../base/util/db.js?v=0.1',
    '../base/util/buffer.js?v=0.1',
    '../base/util/observable.js?v=0.2',
    '../base/util/scheduler.js?v=0.2',
    '../base/core/transaction/tx.js?v=0.2',
    '../base/core/transaction/txPool.js?v=0.2',
    '../base/core/block.js?v=0.2',
    '../base/core/blockchain.js?v=0.2',
    '../base/core/consensus.js?v=0.2',
    '../base/core/wallet.js?v=0.2'
);

class Node {
    constructor() {
        this.nodePort = null;

        this.pool = new TransactionPool();
        this.blockchain = new Blockchain(this.pool);
        this.consensus = new Consensus(this.pool, this.blockchain);

        this.scheduler = new SchedulerAsync();

        this.consensus.on('sync', (data) => {
            switch (data['state']) {
                case SyncType.SYNCHRONIZE_STARTED:
                    this.nodePort.postMessage({
                        'cmd': 'pause'
                    });
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

            this.send({
                'cmd': 'sync', 'msg': data
            });
        });

        this.consensus.on('balance', (balance) => this.send({
            'cmd': 'balance', 'msg': this.blockchain.getAccountBalance()
        }));

        this.consensus.on('height', (height) => this.send({
            'cmd': 'height', 'msg': height
        }));

        this.consensus.on('send', (data) => this.send({
            'cmd': 'network', 'msg': data
        }));

        this.consensus.on('broadcast', (data) => this.send({
            'cmd': 'network', 'msg': [0, data]
        }));
    }

    send(message) {
        self.postMessage(message);
    }

    generateNextBlock() {
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

    mine(block) {
        this.scheduler.addJob(() => {
            if (block)
                this.consensus.addBlock(block);

            const newBlock = this.generateNextBlock();
            this.nodePort.postMessage({
                'cmd': 'mine', 'msg': newBlock
            });
        });
    }

    async init() {
        console.log('MINATO VERSION 0.0.2');

        await KDatabase.delete('hokage4');
        await KDatabase.open('hokage', 1, () => {
            KDatabase.createStore('blockchain', 'index');
            KDatabase.createStore('transaction', 'id');
            KDatabase.createStore('wallet');
        });

        await Wallet.initWallet();

        this.blockchain.init();

        this.send({
            'cmd': 'init', 'msg': Wallet.getPublicFromWallet()
        });

        this.scheduler.start();
    }

    onMessageFromMiner(event) {
        const data = event.data;
        switch (data['cmd']) {
            case 'block':
                this.mine(data['msg']);
                break;
            case 'hashrate':
                this.send(data);
                break;
            case 'state':

                break;
            default:
                break;
        }
    }

    async onmessage(event) {
        const data = event.data;
        switch (data['cmd']) {
            case 'connect':
                this.nodePort = event.ports[0];
                this.nodePort.onmessage = this.onMessageFromMiner.bind(this);
                break;
            case 'init':
                await this.init();
                break;
            case 'mine':
            case 'pause':
                this.nodePort.postMessage(data);
                break;
            case 'sendTransaction':
                this.consensus.transfer(data['address'], data['amount']);
                break;
            case 'network':
                switch (data['type']) {
                    case 'open':
                        this.consensus.start(data['id']);
                        break;
                    case 'data':
                        this.consensus.process(data['id'], data['msg']);
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

const node = new Node();
self.onmessage = async (event) => {
    await node.onmessage(event);
}

self.onerror = (e) => {
    console.log(e.message + " (" + e.filename + ":" + e.lineno + ")");
}

class Node extends Observable {
    constructor() {
        super();

        this._network = null;
        this._blockchain = new Blockchain();
        this._pool = new TransactionPool();
        this._uTxOPool = new UnspentTransactionOutputPool();

        this._consensus = new Consensus(this._blockchain, this._pool, this._uTxOPool, this);
        this._consensus.on('balance', data => {
        });
        this._consensus.on('height', data => {
        });

        this._miner = new Miner(this._blockchain, this._pool, this._uTxOPool);
        this._miner.on('hashrate', (data) => {
            const hashrate = formatHashRate(data) + 'H/s';
        });
    }

    sync(data) {
        switch (data['state']) {
            case SyncType.SYNCHRONIZE_STARTED:
                console.log('SYNCHRONIZE_STARTED');
                $('#pgDownload').show();
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
                $('#pgDownload').hide();
                this._miner.startWork();
                break;
        }

        this.notify('sync', data);
    }

    broadcast(data) {
        this._network.broadcast(data);
    }

    send(id, data) {
        this._network.send(id, data);
    }

    async start() {
        await this._init();
        this.connect();
    }

    async _init() {
        console.log('MINATO VERSION 0.0.2');

        await KDatabase.open('hokage4', 1, () => {
            KDatabase.createStore('blockchain', 'index');
            KDatabase.createStore('transaction', 'id');
            KDatabase.createStore('wallet');
        });

        await Wallet.init();

        $('#lblAccount').text(Wallet.address.base64);
    }

    connect() {
        const signalingServer = 'ws://localhost:3002';

        const configuration = {
            'iceServers': [
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        };

        this._network = new KNetwork(signalingServer, configuration);
        this._network.onconnect = (id) => console.log('id: ' + id);

        this._network.onopen = (id, connections) => {
            console.log(connections);
            this._consensus.start(id);
        };

        this._network.onprogress = (id, percent) => {
        };

        this._network.onmessage = (id, message) => {
            //console.log(`received from: ${id} ${message}`);
            this._consensus.process(id, message);
        };

        this._network.onclose = (id, connections) => {
            console.log(data);
        }
    }

    transfer(address, amount) {
        this._consensus.transfer(address, amount);
    }

    stop() {
        if (this._network)
            this._network.disconnect();
    }
}

const node = new Node();
node.start();
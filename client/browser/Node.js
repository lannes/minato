class Node extends Observable {
    constructor() {
        super();

        this._network = null;
        this._blockchain = new Blockchain();
        this._pool = new TransactionPool();
        this._uTxOPool = new UnspentTransactionOutputPool();

        this._consensus = new Consensus(this._blockchain, this._pool, this._uTxOPool, this);
        this._consensus.on('balance', data => {
            const balance = formatNumber(data);
            $('#lblBalance').text(balance);
            $('#lblAmount').text(balance);
        });
        this._consensus.on('height', data => $('#lblBlock').text(formatNumber(data)));

        this._miner = new Miner(this._blockchain, this._pool, this._uTxOPool);
        this._miner.on('hashrate', (data) => {
            const hashrate = formatHashRate(data) + 'H/s';
            $('#lblMyHashrate').text(hashrate);
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
        let signalingServer = 'ws://localhost:3002';
        if (location.host != 'localhost:8080')
            signalingServer = 'wss://' + location.host + '/minato';

        const configuration = {
            'iceServers': [
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        };

        this._network = new KNetwork(signalingServer, configuration);
        this._network.onconnect = (id) => this.notify('id', id);

        this._network.onopen = (id, connections) => {
            $('#id').text('id: ' + id);
            $('#lblConnections').text(connections);
            this._consensus.start(id);
        };

        this._network.onprogress = (id, percent) => {
            $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
        };

        this._network.onmessage = (id, message) => {
            //console.log(`received from: ${id} ${message}`);
            this._consensus.process(id, message);
        };

        this._network.onclose = (id, connections) => {
            $('#lblConnections').text(connections);
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


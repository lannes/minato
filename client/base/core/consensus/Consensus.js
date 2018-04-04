if (typeof require !== 'undefined') {
    global.Wallet = require('../Wallet');
    global.Observable = require('../util/Observable');
    global.MessageFactory = require('../network/message/MessageFactory');
}

const SyncType = {
    SYNCHRONIZE_STARTED: 0,
    DOWNLOAD_BLOCKCHAIN_FINISHED: 1,
    CONSENSUS_FINISHED: 2,
    DOWNLOAD_TRANSACTION_STARTED: 3,
    DOWNLOAD_TRANSACTION_FINISHED: 4,
    SYNCHRONIZE_COMPLETED: 5
};

class Consensus extends Observable {
    constructor(blockchain, pool, unspentTxOuts) {
        super();
        this.isSync = true;

        this._mempool = pool;
        this._blockchain = blockchain;
        this._unspentTxOuts = unspentTxOuts;

        let self = this;
        this._blockchain.on('push-block', (result) => {
            if (result !== null) {
                this._unspentTxOuts = result;
                this._mempool.update(self._unspentTxOuts);
                this.notify('broadcast', this._blocks(1));
            }
        });
    }

    sendTransaction(address, amount) {
        const tx = Wallet.createTransaction(
            address,
            amount,
            Wallet.getPrivateFromWallet(),
            this._unspentTxOuts,
            this._mempool.transactions
        );

        this._mempool.add(tx, this._unspentTxOuts);
    }

    _send(message) {
        return message.serialize();
    }

    _getBlocks(count) {
        return this._send(new GetBlocksMessage(count));
    }

    _blocks(count) {
        if (count < 1 || count > this._blockchain.length)
            return this._send(new BlocksMessage([]));

        if (count === 1)
            return this._send(new BlocksMessage([this._blockchain.head]));

        //let blocks = [];
        //for (let i = this._blockchain.length - count; i < this._blockchain.length; i++) {
        //    blocks.push(this._blockchain.blocks[i]);
        //}

        //return this._send(new BlocksMessage(blocks));
        return this._send(new BlocksMessage(this._blockchain.blocks));
    }

    _getPool() {
        return this._send(new GetPoolMessage());
    }

    _pool() {
        return this._send(new PoolMessage(this._mempool.transactions));
    }

    _addBlockchain(blocks) {
        const unspentTxOuts = this._blockchain.replaceChain(blocks);
        if (unspentTxOuts !== null) {
            this._unspentTxOuts = unspentTxOuts;
            this._mempool.update(this._unspentTxOuts);
            this.notify('broadcast', this._blocks(1));
        }

        return unspentTxOuts;
    }

    _getBalance() {
        return Account.getMyBalance(this._unspentTxOuts);
    }

    _checkReceivedBlocks(id, blocks) {
        if (blocks.length === 0) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }
            return;
        }

        const headReceived = blocks[blocks.length - 1];

        const head = this._blockchain.head;
        if (headReceived.height <= head.height) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
                this.isSync = false;
            }

            if (headReceived.height == head.height)
                this.notify('balance', this._getBalance());

            this.notify('height', this._blockchain.height + 1);
            return;
        }

        if (ArrayUtils.equals(head.hash(), headReceived.prevHash)) {
            if (this.isSync) {
                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': headReceived });
                this.isSync = false;
            }
        } else if (blocks.length === 1) {
            this.notify('broadcast', this._getBlocks(headReceived.height - head.height));

            this.isSync = true;
            this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_STARTED });
        } else {
            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_BLOCKCHAIN_FINISHED });

            if (this._addBlockchain(blocks))
                this.notify('balance', this._getBalance());

            this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_STARTED });

            this.notify('broadcast', this._getPool());
        }

        this.notify('height', this._blockchain.height + 1);
    }

    process(id, raw) {
        const buf = new KBuffer(raw);
        let type = MessageFactory.peekType(buf);
        let message = MessageFactory.parse(buf);

        switch (type) {
            case Message.Type.GET_BLOCKS:
                const count = message.count;
                this.notify('send', [id, this._blocks(count)]);
                break;
            case Message.Type.BLOCKS: {
                const blocks = message.blocks;
                if (blocks === null)
                    break;

                this._checkReceivedBlocks(id, blocks);
            }
                break;
            case Message.Type.GET_POOL:
                this.notify('send', [id, this._pool()]);
                break;
            case Message.Type.POOL: {
                this.isSync = false;
                this.notify('sync', { 'id': id, 'state': SyncType.DOWNLOAD_TRANSACTION_FINISHED });

                const transactions = message.transactions;
                if (transactions === null) {
                    console.log('invalid transaction received');
                    return;
                }

                for (let i = 0; i < transactions.length; i++) {
                    let transaction = transactions[i];
                    try {
                        this._mempool.add(transaction, this._unspentTxOuts);
                        this.notify('broadcast', this._pool());
                    } catch (e) {
                        console.log(e.message);
                    }
                }

                this.notify('sync', { 'id': id, 'state': SyncType.SYNCHRONIZE_COMPLETED, 'block': null });
            }
                break;
        }
    }

    get unspentTxOuts() {
        return this._unspentTxOuts;
    }

    start(id) {
        this.notify('send', [id, this._getBlocks(1)]);
    }

    transfer(address, amount) {
        this.sendTransaction(Address.fromBase64(address), amount);
        this.notify('broadcast', this._pool());
    }
}

if (typeof module !== 'undefined')
    module.exports = Consensus;

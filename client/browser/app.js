const formatBalance = (n) => {
    let result = n.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

const formatHashRate = (n) => {
    if (isNaN(n))
        return '0 ';

    if (n < 1024)
        return n + ' ';

    if (n < 1048576)
        return (n / 1024).toFixed(2) + ' k';

    if (n < 1073741824)
        return (n / 1048576).toFixed(2) + ' m';

    return (n / 1073741824).toFixed(2) + ' g';
}

if (typeof (window.Worker) === 'undefined') {
    alert('No Web Worker support');
}

class KApp {
    constructor() {
        this.network = null;
        this.isMining = false;

        this.node = new Worker('./browser/worker/node.js');
        this.miner = new Worker('./browser/worker/miner.js');
        this.channel = new MessageChannel();

        this.node.postMessage({ 'cmd': 'connect' }, [this.channel.port1]);
        this.miner.postMessage({ 'cmd': 'connect' }, [this.channel.port2]);

        this.node.onmessage = this._onmessage.bind(this);

        this.node.onerror = (event) => {
            console.log(event);
        };
    }

    start() {
        this.node.postMessage({ 'cmd': 'init' });
    }

    mining() {
        if (this.isMining) {
            this.node.postMessage({ 'cmd': 'pause' });
        } else {
            this.node.postMessage({ 'cmd': 'mine' });
        }
    }

    stop() {
        if (this.network)
            this.network.disconnect();
    }

    transfer(address, amount) {
        this.node.postMessage({ 'cmd': 'sendTransaction', 'address': address, 'amount': amount });
    }

    _onmessage(event) {
        const data = event.data;
        switch (data['cmd']) {
            case 'init':
                $('#lblAccount').text(data['msg']);
                this.initNetwork();
                break;
            case 'sync':
                if (data['msg']['state'] === 0) {
                    $('#pgDownload').show();
                }

                if (data['msg']['state'] === 5) {
                    $('#pgDownload').hide();
                }
                break;
            case 'mining': {
                const state = data['state'];
                if (state)
                    $('#btnMining').text('Pause Mining');
                else
                    $('#btnMining').text('Resume Mining');
            }
                break;
            case 'hashrate': {
                const hashrate = formatHashRate(data['msg']) + 'H/s';
                $('#lblMyHashrate').text(hashrate);
            }
                break;
            case 'height':
                $('#lblBlock').text(data['msg']);
                break;
            case 'balance': {
                const balance = formatBalance(data['msg']);
                $('#lblBalance').text(balance);
                $('#lblAmount').text(balance);
            }
                break;
            case 'network': {
                if (data['msg'].length !== 2)
                    return;

                const id = data['msg'][0];
                const msg = data['msg'][1];
                if (id === 0)
                    this.network.broadcast(JSON.stringify(msg));
                else
                    this.network.send(id, JSON.stringify(msg));
            }
                break;
        }
    }

    initNetwork() {
        let signalingServer = 'ws://localhost:3002';
        if (location.host != 'localhost:3001')
            signalingServer = 'wss://' + location.host + '/minato';

        const configuration = {
            'iceServers': [
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        };

        //this.webp2p = new WebRTC(signalingServer, configuration);

        this.network = new KNetwork(signalingServer, configuration);

        this.network.onconnect = (id) => {
            $('#id').text('id: ' + id);
        }

        this.network.onopen = (id, connections) => {
            $('#lblConnections').text(connections);
            this.node.postMessage({ 'cmd': 'network', 'id': id, 'type': 'open' });
        };

        this.network.onprogress = (id, percent) => {
            $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
        };

        this.network.onmessage = (id, message) => {
            //console.log('received from: ' + id + ' ' + message);

            try {
                let data = JSON.parse(message);
                this.node.postMessage({ 'cmd': 'network', 'id': id, 'type': 'data', 'msg': data });
            } catch (e) {
                console.log(e);
                console.log(message);
            }
        };

        this.network.onclose = (id, connections) => {
            $('#lblConnections').text(connections);
        }
    }
}

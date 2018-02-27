const formatBalance = (number) => {
    let result = number.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

if (typeof (window.Worker) === 'undefined') {
    alert('No Web Worker support');
}

class App {
    constructor() {
        this.webp2p = null;

        this.node = new Worker('./core/node.js');
        this.miner = new Worker('./core/miner/minerWorker.js');
        this.channel = new MessageChannel();

        this.node.postMessage({ 'cmd': 'connect' }, [this.channel.port1]);
        this.miner.postMessage({ 'cmd': 'connect' }, [this.channel.port2]);

        this.node.onmessage = this._onmessage.bind(this);

        this.node.onerror = (event) => {
            console.log(event);
        };
    }

    start() {
        this.execute({ 'cmd': 'init' });
    }

    stop() {
        if (this.webp2p)
            this.webp2p.disconnect();
    }

    execute(cmd) {
        this.node.postMessage(cmd);
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
            case 'hashrate': {
                const hashrate = data['msg'] + ' H/s';
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
                    this.webp2p.broadcast(JSON.stringify(msg));
                else
                    this.webp2p.send(id, JSON.stringify(msg));
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

        this.webp2p = new WebP2P(signalingServer, configuration);

        this.webp2p.onopen = (id, connections) => {
            $('#lblConnections').text(connections);
            this.execute({ 'cmd': 'network', 'id': id, 'type': 'open' });
        };

        this.webp2p.onprogress = (id, percent) => {
            $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
        };

        this.webp2p.onmessage = (id, message) => {
            //console.log('received from: ' + id + ' ' + message);
            try {
                let data = JSON.parse(message);
                this.execute({ 'cmd': 'network', 'id': id, 'type': 'data', 'msg': data });
            } catch (e) {
                console.log(e);
            }
        };

        this.webp2p.onclose = (id, connections) => {
            $('#lblConnections').text(connections);
        }
    }
}

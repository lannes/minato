
const KNetwork = require('../base/core/network/network');

class KApp {
    constructor() {
        this.network = null;
        this.isMining = false;

        this._initNetwork();
    }

    start() {
    }

    mining() {
        if (this.isMining) {
        } else {
        }
    }

    stop() {
        if (this.network)
            this.network.disconnect();
    }

    transfer(address, amount) {
    }

    _initNetwork() {
        let signalingServer = 'ws://localhost:3002';
        //if (location.host != 'localhost:3001')
        //    signalingServer = 'wss://' + location.host + '/minato';

        const configuration = {
            'iceServers': [
                { 'urls': 'stun:stun.l.google.com:19302' }
            ]
        };

        this.network = new KNetwork(signalingServer, configuration);

        this.network.onconnect = (id) => {
            console.log('id: ' + id);
        }

        this.network.onopen = (id, connections) => {
            console.log(connections);
            //this.node.postMessage({ 'cmd': 'network', 'id': id, 'type': 'open' });
        };

        this.network.onprogress = (id, percent) => {
        };

        this.network.onmessage = (id, message) => {
            console.log('received from: ' + id + ' ' + message);

            try {
                let data = JSON.parse(message);
                //this.node.postMessage({ 'cmd': 'network', 'id': id, 'type': 'data', 'msg': data });
            } catch (e) {
                console.log(e);
                console.log(message);
            }
        };

        this.network.onclose = (id, connections) => {
            console.log(connections);
        }
    }
}

const app = new KApp();


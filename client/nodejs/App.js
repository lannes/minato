
const KNetwork = require('../base/network/network');
const Node = require('./Node');

class App {
    constructor() {
        this._node = null;
        this._network = null;
        this._isMining = false;

        this._initNetwork();
    }

    start() {
    }

    mining() {
        if (this._isMining) {
        } else {
        }
    }

    stop() {
        if (this._network)
            this._network.disconnect();
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

        this._network = new KNetwork(signalingServer, configuration);
        this._node = new Node(this._network);

        this._network.onconnect = (id) => {
            console.log('id: ' + id);
        }

        this._network.onopen = (id, connections) => {
            console.log(connections);
            this._node.onmessage({ 'cmd': 'network', 'id': id, 'type': 'open' });
        };

        this._network.onprogress = (id, percent) => {
        };

        this._network.onmessage = (id, message) => {
            this._node.onmessage({ 'cmd': 'network', 'id': id, 'type': 'data', 'msg': message });
        };

        this._network.onclose = (id, connections) => {
            console.log(connections);
        }
    }
}

const app = new App();


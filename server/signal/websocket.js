const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const UUID = require('./uuid');

class WebSocketServer {
    constructor(port) {
        this.wss = null;
        this.port = port;
        this.clients = new Map();
        this.isAlive = false;
        this._createServer();
        this._listen();
    }

    _createServer() {
        this.wss = new WebSocket.Server({ port: this.port });
        console.log(`WebSocketServer has started at port: ${this.port}`);
    }

    _removeClient(id) {
        this.clients.delete(id);
    }

    _registerClient(id, ws) {
        ws['id'] = id;

        this.clients.set(id, ws);

        this._send(id, ['id', id]);
    }

    _updateUserListOnClients() {
        let userList = new Array();
        this.clients.forEach((websocket, id) => {
            userList.push(id);
        });

        this._broadcast(['clients', userList.length]);
    }

    _send(id, message) {
        let msg = JSON.stringify(message);

        let ws = this.clients.get(id);
        if (ws === undefined || ws === null)
            return;

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg, (err) => {
                if (err)
                    console.log(err);
            });
        }
    }

    _broadcast(message, exclude) {
        let self = this;
        let msg = JSON.stringify(message);

        this.clients.forEach((websocket, id) => {
            if (id === exclude)
                return;

            try {
                if (websocket.readyState === WebSocket.OPEN) {
                    websocket.send(msg);
                }
            } catch (error) {
                self._removeClient(id);
                self._updateUserListOnClients();

                console.log(error);
            }
        });
    }

    _getClientId(ws) {
        this.clients.forEach((websocket, id) => {
            if (websocket == ws)
                return id;
        });

        return null;
    }

    _listen() {
        var self = this;
        this.wss.on('connection', (ws, req) => {
            const ip = req.connection.remoteAddress || req.headers['x-forwarded-for'];

            const location = url.parse(req.url, true);
            // You might use location.query.access_token to authenticate or share sessions
            // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

            let userAgent = req.headers['user-agent'];
            console.log(`connected ${ip} ${userAgent}`);

            let id = location.query['id'];
            if (id) {
                console.log(`reconnected [${id}]`);
            } else {
                id = UUID.v4();
                console.log(`connected [${id}]`);
            }

            self._registerClient(id, ws);

            self._updateUserListOnClients();

            self._broadcast(['initiator', id], id);

            ws['isAlive'] = true;
            ws.on('pong', () => {
                ws['isAlive'] = true;
            });

            ws.on('message', (message) => {
                try {
                    let data = JSON.parse(message);
                    let type = data[0];
                    if (type !== 'data')
                        return;

                    if (data[2].sdp || data[2].candidate) {
                        let id = ws['id'];
                        let target = data[1];
                        if (target == id)
                            return;

                        self._send(target, [type, id, data[2]]);

                        console.log(`${id} -> ${target} ${data[2].sdp | data[2].candidate}`);
                    }

                } catch (e) {
                    console.log(e);
                }
            });

            ws.on('close', (code, reason) => {
                console.log(`disconnected [${ws['id']}] ${reason}`);

                let id = ws['id'];

                self._removeClient(id);
                self._updateUserListOnClients();
            });

            ws.on('error', (e) => {
                console.log('error: ' + e.message);
            });
        });

        const interval = setInterval(() => {
            self.clients.forEach((websocket, id) => {
                if (websocket['isAlive'] === false)
                    return websocket.terminate();

                websocket['isAlive'] = false;
                websocket.ping(() => { });
            });
        }, 30000);
    }
}

module.exports = WebSocketServer;
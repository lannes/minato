import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';

import { UUID } from './webcore/uuid';

export class WebSocketServer {
    private wss: WebSocket.Server;
    private port: string | number;
    private clients = new Map<string, WebSocket>();
    private isAlive = false;

    constructor(port: string | number) {
        this.port = port;
        this.createServer();
        this.listen();
    }

    private createServer = (): void => {
        this.wss = new WebSocket.Server(<WebSocket.ServerOptions>{ port: this.port });
        console.log(`WebSocketServer has started at port: ${this.port}`);
    }

    private removeClient = (id: string): void => {
        this.clients.delete(id);
    }

    private registerClient = (id: string, ws: WebSocket): void => {
        ws['id'] = id;

        this.clients.set(id, ws);

        this.send(id, ['id', id]);
    }

    private updateUserListOnClients = (): void => {
        let userList = new Array();
        this.clients.forEach((websocket, id) => {
            userList.push(id);
        });

        this.broadcast(['clients', userList.length]);
    }

    private send = (id, message) => {
        let msg = JSON.stringify(message);

        let ws = this.clients.get(id);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg, (err: Error) => {
                if (err)
                    console.log(err);
            });
        }
    }

    private broadcast = (message, exclude?: string) => {
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
                self.removeClient(id);
                self.updateUserListOnClients();

                console.log(error);
            }
        });
    }

    private getClientId = (ws: WebSocket): string => {
        this.clients.forEach((websocket, id) => {
            if (websocket == ws)
                return id;
        });

        return null;
    }

    private listen = (): void => {
        var self = this;
        this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
            const ip = req.connection.remoteAddress || req.headers['x-forwarded-for'];

            const location = url.parse(req.url, true);
            // You might use location.query.access_token to authenticate or share sessions
            // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

            let userAgent = req.headers['user-agent'];
            console.log(`connected ${ip} ${userAgent}`);

            let id = UUID.v4();

            self.registerClient(id, ws);

            self.updateUserListOnClients();

            self.broadcast(['initiator', id], id);

            ws['isAlive'] = true;
            ws.on('pong', () => {
                ws['isAlive'] = true;
            });

            ws.on('message', (message) => {
                try {
                    let data = JSON.parse(<string>message);
                    let type = data[0];

                    if (type == 'sdp' || type == 'candidate') {
                        let id = ws['id'];
                        let target = data[1];
                        if (target == id)
                            return;

                        self.send(target, [type, id, data[2]]);

                        console.log(`${id} -> ${target} ${type}`);
                    }
                } catch (e) {
                    console.log(e);
                }
            });

            ws.on('close', (code, reason) => {
                console.log('disconnected ' + reason);

                let id = ws['id'];

                self.removeClient(id);
                self.updateUserListOnClients();
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
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

        ws.send(JSON.stringify(['id', id]));
    }

    private updateUserListOnClients = (): void => {
        let userList = new Array();
        this.clients.forEach((websocket, id) => {
            userList.push(id);
        });

        this.broadcast(JSON.stringify(['clients', userList.length]));
    }

    private send = (id, message) => {
        this.clients.get(id).send(message);
    }

    private broadcast = (message: string, exclude?: string) => {
        var self = this;
        this.clients.forEach((websocket, id) => {
            if (id === exclude)
                return;

            try {
                if (websocket.readyState === WebSocket.OPEN) {
                    let data = JSON.parse(message)[0];
                    console.log(` -> ${id} ${data}`);
                    websocket.send(message);
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

            self.broadcast(JSON.stringify(['initiator', id]), id);

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

                        let newMsg = JSON.stringify([type, id, data[2]]);
                        self.send(target, newMsg);

                        console.log(`${id} -> ${target} ${type}`);
                    }
                } catch (e) {
                    console.log(e);
                }
            });

            ws.on('close', () => {
                console.log('disconnected');

                let id = ws['id'];

                self.removeClient(id);
                self.updateUserListOnClients();
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
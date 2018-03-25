process.on('uncaughtException', (err: Error) => {
    const message = err.message;
    if (message &&
        (message.startsWith('connect E') ||
            message === 'Cannot read property \'aborted\' of null'))
        return;

    console.error(`Uncaught exception: ${message || err}`, err);
});

import * as cfg from '../config.json';

import { Server } from './webcore/server';
import { Feedback } from './webcore/feedback';
import { WebSocketServer } from './websocket';

const httpPort: number = parseInt(process.env.HTTP_PORT) || 3001;

const initHttpServer = (port: number) => {
    let server = new Server();
    let router = server.router();

    router.get('/', (req, res) => {
        Feedback.cacheFile(res, 'index.html');
    });

    server.start(port);
};

const initWebSocketServer = (port) => {
    const server = new WebSocketServer(port);
}

initHttpServer(httpPort);
initWebSocketServer((<any>cfg).INTERNAL_PORT);

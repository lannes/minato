process.on('uncaughtException', (err: Error) => {
    const message = err.message;
    if (message &&
        (message.startsWith('connect E') ||
            message === 'Cannot read property \'aborted\' of null'))
        return;

    console.error(`Uncaught exception: ${message || err}`, err);
});

import * as cfg from '../../config.json';

import { WebSocketServer } from './websocket';

const initWebSocketServer = (port) => {
    const server = new WebSocketServer(port);
}

initWebSocketServer((<any>cfg).INTERNAL_PORT);

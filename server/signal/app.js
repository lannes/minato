process.on('uncaughtException', (err) => {
    const message = err.message;
    if (message &&
        (message.startsWith('connect E') ||
            message === 'Cannot read property \'aborted\' of null'))
        return;

    console.error(`Uncaught exception: ${message || err}`, err);
});

const WebSocketServer = require('./websocket');

const initWebSocketServer = (port) => {
    const server = new WebSocketServer(port);
};

initWebSocketServer(3002);

import * as cfg from '../config.json';

import { Server } from './webcore/server';
import { Feedback } from './webcore/feedback';

const httpPort: number = parseInt(process.env.HTTP_PORT) || 3001;

const initHttpServer = (port: number) => {
    let server = new Server('client');
    let router = server.router();

    router.get('/', (req, res) => {
        Feedback.cacheFile(res, 'index.html');
    });

    server.start(port);
};

initHttpServer(httpPort);

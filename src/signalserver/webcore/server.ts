import * as fs from 'fs';
import * as url from 'url';
import * as path from 'path';
import * as http from 'http';

import { Router } from './router';
import { Cookie } from './cookie';
import { Feedback } from './feedback';

export class Server {
    private _router: Router;

    constructor() {
        this._router = new Router(this);

        this._router.get('/robots.txt', (request, response) => {
            response.setHeader('Content-Type', 'text/plain');
            response.end('User-agent: *\nDisallow: /');
        });
    }

    public router = (): Router => {
        return this._router;
    }

    public start = (port: number): void => {
        const onRequest = (request, response) => {
            request.cookies = Cookie.parse(request);

            response.setHeader('Access-Control-Allow-Origin', '*');
            response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
            response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
            response.setHeader('Access-Control-Allow-Credentials', true);
            response.setHeader('Access-Control-Max-Age', '86400');

            if (request.method == 'OPTIONS') {
                response.end();
            } else {
                this._router.route(request, response);
            }
        }

        http.createServer(onRequest).listen(port, () => {
            console.log(`HttpServer has started at port: ${port}`);
        });
    }
}

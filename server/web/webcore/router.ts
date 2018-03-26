import * as url from 'url';
import * as path from 'path';
import * as qs from 'querystring';

import { Server } from './server';
import { Feedback } from './feedback';
import { Protocol } from './protocol';

export class Router {
    private _handle: object;
    private _server: Server;

    constructor(server: Server) {
        this._handle = {};
        this._server = server;
    }

    public get = (path: string, callback: (request, response) => void) => {
        this._handle[path] = callback;
    }

    public post = (path: string, callback: (request, response) => void) => {
        this._handle[path] = callback;
    }

    public file = (response, filename: string): void => {
        Feedback.cacheFile(response, filename);
    }

    public route = async (request, response) => {
        const pathname = url.parse(request.url).pathname;

        if (typeof this._handle[pathname] === 'function') {
            let query = url.parse(request.url).query;
            request['query'] = qs.parse(query);

            if (request.method == 'POST') {
                request['body'] = await Protocol.processPost(pathname, request);

                this._handle[pathname](request, response);
            } else if (request.method == 'GET') {
                this._handle[pathname](request, response);
            }
        } else {
            Feedback.cacheFile(response, pathname);
        }
    }
}

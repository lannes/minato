import * as fs from 'fs';
import * as path from 'path';
import Mem from './memory';
import { TemplateEngine } from './template';

export class Feedback {
    public static readonly EXTS: string = '.ico.htm.html.css.js.json.eot.svg.ttf.woff.woff2.otf.md.txt';
    public static readonly CONTENT_TYPE = {
        'ico': 'image/x-icon',
        'html': 'text/html; charset=utf-8',
        'htm': 'text/html; charset=utf-8',
        'css': 'text/css',
        'js': 'application/javascript; charset=utf-8',
        'json': 'application/json',
        'eot': 'application/vnd.ms-fontobject',
        'svg': 'image/svg+xml; charset=utf-8',
        'ttf': 'application/octet-stream',
        'woff': 'application/font-woff',
        'woff2': 'application/font-woff2',
        'otf': 'font/otf',
        'txt': 'text/plain',
        'png': 'image/png',
        'gif': 'image/gif',
        'jpeg': 'image/jpeg',
        'jpg': 'image/jpg'
    };

    private static extension = (uri: string): string => {
        return uri.substr(uri.lastIndexOf('.') + 1);
    }

    public static redirect = (response, page: string): void => {
        //response.statusCode = 302;
        //response.setHeader('Location', page);
        //response.end();

        response.writeHead(302, { Location: `${page}` });
        response.end();
    }

    public static notfound = (response): void => {
        response.statusCode = 404;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.write('404 Not Found');
        response.end();
    }

    public static json = (response, message: object): void => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.write(JSON.stringify(message), 'utf8');
        response.end();
    }

    public static text = (response, status = 200, message: string): void => {
        response.statusCode = status;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.write(message, 'utf8');
        response.end();
    }

    public static html = (response, data: string): void => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.write(data, 'utf8');
        response.end();
    }

    public static file = (response, data: string, extension: string): void => {
        if (extension === 'htm' || extension === 'html') {
            Feedback.html(response, data);
            return;
        }

        response.statusCode = 200;

        let contentType = Feedback.CONTENT_TYPE[extension];
        if (contentType)
            response.setHeader('Content-Type', contentType);
        else
            response.setHeader('Content-Type', 'text/' + extension);

        response.write(data, 'utf8');
        response.end();
    }

    public static message = (response, message: { code: number, msg: string }): void => {
        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.write(JSON.stringify(message), 'utf8');
        response.end();
    }

    public static cacheFile = (response, filename: string, options?): void => {
        let ext = Feedback.extension(filename);
        let cache = Mem.get(filename) as string;

        if (cache) {
            if (options) {
                let content = TemplateEngine.create(cache, options);
                Feedback.file(response, content, ext);
                return;
            }

            Feedback.file(response, cache, ext);
        } else {
            let filepath = path.join(process.cwd(), '/' + <string>Mem.get('webdir'), filename);
            fs.readFile(filepath, 'utf8', (err, data) => {
                if (err) {
                    console.log(filepath);
                    console.log(err);
                    Feedback.notfound(response);
                    return;
                }

                if (Feedback.EXTS.indexOf('.' + ext) > -1) {
                    Mem.set(filename, data);
                }

                if (options) {
                    let content = TemplateEngine.create(data, options);
                    Feedback.file(response, content, ext);
                    return;
                }

                Feedback.file(response, data, ext);
            });
        }
    }
}

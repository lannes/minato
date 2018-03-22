import * as url from 'url';
import * as http from 'http';
import * as https from 'https';
import * as qs from 'querystring';

export class Protocol {
    private static httpHead = async (link: string): Promise<number> => {
        return new Promise<number>((resolve) => {
            let options = {
                method: 'HEAD',
                host: url.parse(link).host,
                port: 80,
                path: url.parse(link).pathname
            };

            let request = http.request(options, (response) => {
                resolve(response.statusCode);
            });
            request.end();
        });
    }

    private static httpsHead = async (link: string): Promise<number> => {
        return new Promise<number>((resolve) => {
            let options = {
                method: 'HEAD',
                host: url.parse(link).host,
                port: 443,
                path: url.parse(link).pathname
            };

            let request = https.request(options, (response) => {
                resolve(response.statusCode);
            });
            request.end();
        });
    }

    public static head = async (link: string): Promise<number> => {
        if (link.indexOf('https') === 0) {
            return Protocol.httpsHead(link);
        }

        return Protocol.httpHead(link);
    }

    public static processPost = async (path: string, request): Promise<any> => {
        return new Promise<any>((resolve) => {
            let body = '';

            request.on('data', (data) => {
                body += data;

                // Too much POST data, kill the connection!
                // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                if (body.length > 1e6)
                    request.connection.destroy();
            });

            request.on('error', (error) => {
                console.log(error);
                resolve(null);
            });

            request.on('end', () => {
                let obj = null;

                let contentType = request.headers['content-type'];
                try {
                    obj = JSON.parse(body);
                } catch (error) {
                    obj = qs.parse(body);
                }

                resolve(obj);
            });
        });
    }

    public static post = async (link: string, data: any): Promise<any> => {
        return new Promise<any>((resolve) => {
            let options = {
                method: 'POST',
                host: url.parse(link).host,
                path: url.parse(link).pathname,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            let request = https.request(options, (response) => {
                let result = '';
                response.on('data', (chunk) => {
                    result += chunk;
                });

                request.on('error', (error) => {
                    console.log(error);
                    resolve(null);
                });

                response.on('end', () => {
                    resolve(result);
                });
            });

            request.write(data);
            request.end();
        });
    }
}

import { Security } from './security';

export class Cookie {
    public static COOKIE_ENCRYPT_NAME: string = 'common';

    public static parse = (request): object => {
        let list = {};
        let rc = request.headers.cookie;
        if (!rc)
            return list;

        rc && rc.split(';').forEach(cookie => {
            let parts = cookie.split('=');
            list[parts.shift().trim()] = decodeURI(parts.join('='));
        });

        if (list[Cookie.COOKIE_ENCRYPT_NAME]) {
            for (let property in list) {
                if (list.hasOwnProperty(property) && property != Cookie.COOKIE_ENCRYPT_NAME) {
                    list[property] = Security.decrypt(list[property]);
                }
            }
        }

        return list;
    }

    public static make = (request, response, pair: Map<string, string>, expires: number, encrypt: boolean): void => {
        let time = new Date(new Date().getTime() + expires).toUTCString();
        let cookies = [];

        let domain = request.headers.host;

        // Internet Explorer will ignore the max-age and just use expires       
        if (domain.indexOf('localhost') == 0) {
            pair.forEach((value, key) => {
                let data = value;
                if (encrypt)
                    data = Security.encrypt(value);

                cookies.push(`${key}=${data};expires=${time};Path=/`);
            });

            if (encrypt)
                cookies.push(`${Cookie.COOKIE_ENCRYPT_NAME}=.;expires=${time};Path=/`);
        } else {
            pair.forEach((value, key) => {
                let data = value;
                if (encrypt)
                    data = Security.encrypt(value);

                cookies.push(`${key}=${data};expires=${time};domain=${domain};Path=/`);
            });

            if (encrypt)
                cookies.push(`${Cookie.COOKIE_ENCRYPT_NAME}=.;expires=${time};domain=${domain};Path=/`);
        }

        response.setHeader('Set-Cookie', cookies);
    }

    public static clear = (request, response, pair: Map<string, string>): void => {
        let time = new Date().toUTCString();
        let cookies = [];

        let domain = request.headers.host;
        if (domain.indexOf('localhost') == 0) {
            pair.forEach((value, key) => {
                cookies.push(`${key}=;expires=${time};Path=/`);
            });
        } else {
            pair.forEach((value, key) => {
                cookies.push(`${key}=;expires=${time};domain=${domain};Path=/`);
            });
        }

        response.setHeader('Set-Cookie', cookies);
    }
}
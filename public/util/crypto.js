// ECDSA - Elliptic Curve Digital Signature Algorithm
// NIST recommended curve P-256, also known as secp256r1.
var crypt = this.crypto || this.msCrypto;

class Elliptic {
    static base64ToHex(base64) {
        const data = atob((base64 + '===='.substr(base64.length % 4))
            .replace(/\-/g, '+')
            .replace(/\_/g, '/'));

        let result = '';
        for (let i = 0; i < data.length; i++) {
            let hex = data.charCodeAt(i).toString(16);
            result += (hex.length == 2 ? hex : '0' + hex);
        }

        return result;
    }

    static hexToBase64(hex) {
        let raw = '';
        for (let i = 0; i < hex.length; i += 2) {
            raw += String.fromCharCode(parseInt(hex[i] + hex[i + 1], 16));
        }

        return btoa(raw).replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    static generatePublicKey(keyPair) {
        const x = Elliptic.base64ToHex(keyPair.x);
        const y = Elliptic.base64ToHex(keyPair.y);

        return '04' + x + y;
    }

    static generatePrivateKey(keyPair) {
        return Elliptic.base64ToHex(keyPair.d);
    }

    static async importPublicKey(publicKeyHex) {
        const x = Elliptic.hexToBase64(publicKeyHex.substring(2, 66));
        const y = Elliptic.hexToBase64(publicKeyHex.substring(66));

        const publicKey = await crypt.subtle.importKey(
            'jwk',
            {
                kty: 'EC',
                crv: 'P-256',
                x: x,
                y: y,
                ext: true,
            },
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            false,
            ['verify']
        );

        return publicKey;
    }

    static async importPrivateKey(publicKeyHex, privateKeyHex) {
        const x = Elliptic.hexToBase64(publicKeyHex.substring(2, 66));
        const y = Elliptic.hexToBase64(publicKeyHex.substring(66));
        const d = Elliptic.hexToBase64(privateKeyHex);

        const privateKey = await crypt.subtle.importKey(
            'jwk',
            {
                kty: 'EC',
                crv: 'P-256',
                x: x,
                y: y,
                d: d,
                ext: true,
            },
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            false,
            ['sign']
        )

        return privateKey;
    }

    static async generateKeyPair() {
        const key = await crypt.subtle.generateKey(
            {
                name: 'ECDSA',
                namedCurve: 'P-256',
            },
            true,
            ['sign', 'verify']
        );

        const keyPair = await crypt.subtle.exportKey(
            'jwk',
            key.privateKey
        );

        return keyPair;
    }

    static async sign(privateKey, data) {
        if (typeof (data) == 'string')
            data = new TextEncoder('utf-8').encode(data);

        const signature = await crypt.subtle.sign(
            {
                name: 'ECDSA',
                hash: { name: 'SHA-256' },
            },
            privateKey,
            data //ArrayBuffer of data you want to sign
        );

        const array = Array.from(new Uint8Array(signature));
        return buf2hex(array);
    }

    static async verify(publicKey, signature, data) {
        let arrSignature = hex2buf(signature);
        
        let arrData = null;
        if (typeof (data) == 'string')
            arrData = new TextEncoder('utf-8').encode(data);

        const isvalid = await crypt.subtle.verify({
            name: 'ECDSA',
            hash: { name: 'SHA-256' },
        },
            publicKey,
            arrSignature, //ArrayBuffer of the signature
            arrData //ArrayBuffer of the data
        );

        return isvalid;
    }
}

// ECDSA - Elliptic Curve Digital Signature Algorithm
// NIST recommended curve P-256, also known as secp256r1.
var crypt = this.crypto || this.msCrypto;

class Elliptic {
    static generatePublicKey(keyPair) {
        return keyPair.x + keyPair.y;
    }

    static generatePrivateKey(keyPair) {
        return keyPair.d;
    }

    static async importPublicKey(publicData) {
        const x = publicData.substring(0, (publicData.length / 2));
        const y = publicData.substring(publicData.length / 2);

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
    
    static async importPrivateKey(publicData, privateData) {
        const x = publicData.substring(0, (publicData.length / 2));
        const y = publicData.substring(publicData.length / 2);
        const d = privateData;

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

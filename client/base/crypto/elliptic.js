// ECDSA - Elliptic Curve Digital Signature Algorithm
// NIST recommended curve P-256, also known as secp256r1.

let EC = null;

if (typeof require !== 'undefined') {
    const ec = require('elliptic').ec;
    EC = new ec('secp256k1');

    global.KBuffer = require('../util/buffer');
} else {
    EC = new elliptic.ec('secp256k1');
}

class KElliptic {
    static generateKeyPair() {
        const keyPair = EC.genKeyPair();
        return {
            private: keyPair.getPrivate(),
            public: keyPair.getPublic()
        };
    }

    static generatePublicData(publicKey) {
        return publicKey.encode('bin');
    }

    static generatePrivateData(privateKey) {
        return privateKey.toArray();
    }

    static importPublicKey(publicData) {
        //return EC.keyFromPublic(Array.from(publicData));
        return EC.keyFromPublic(publicData);
    }

    static importPrivateKey(privateData) {
        return EC.keyFromPrivate(privateData, 'bin');
    }

    static sign(privateKey, data) {
        return privateKey.sign(data).toDER();
    }

    static verify(publicKey, signature, data) {
        return publicKey.verify(data, signature);
    }
}

if (typeof module !== 'undefined')
    module.exports = KElliptic;
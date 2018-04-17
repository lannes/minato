// Ed25519-like signatures with X25519 keys, Axolotl-style.

if (typeof require !== 'undefined') {
} else {
}

class KElliptic {
    static generateKeyPair() {
        const seed = self.crypto.getRandomValues(new Uint8Array(32));
        const keys = axlsign.generateKeyPair(seed);
        return keys;
    }

    static sign(privateKey, msg) {
        return axlsign.sign(privateKey, msg);
    }

    static verify(publicKey, signature, msg) {
        return axlsign.verify(publicKey, msg, signature);
    }
}

if (typeof module !== 'undefined')
    module.exports = KElliptic;
/*
var crypt = this.crypto || this.msCrypto;
*/
class KHash {
    static sha256(message) {
        const hashBuffer = sjcl.hash.sha256.hash(message);
        return sjcl.codec.hex.fromBits(hashBuffer);
    }

    /*
    static async sha256(message) {
        let msgBuffer = null;
        if (typeof message === 'string') {
            msgBuffer = KBuffer.str2buffer(message);
        } else {
            msgBuffer = message;
        }

        const hashBuffer = await crypt.subtle.digest('SHA-256', msgBuffer);
        return KBuffer.buffer2hex(hashBuffer);
    }
    */
}

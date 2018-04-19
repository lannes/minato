/*
var crypt = this.crypto || this.msCrypto;
*/
class KHash {
    static sha256(message) {
        return SHA256.digest(message);
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


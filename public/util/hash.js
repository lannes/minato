if (typeof require !== 'undefined') {
    global.KBuffer = require('./util/buffer');
} 

var crypt = this.crypto || this.msCrypto;

class KHash {
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
}

if (typeof module !== 'undefined')
    module.exports = KHash;
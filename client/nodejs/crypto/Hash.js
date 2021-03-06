const crypto = require('crypto');

class KHash {
    static sha256(message) {
        return crypto.createHash('sha256').update(message).digest();
    }
}

module.exports = KHash;

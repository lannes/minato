var crypt = this.crypto || this.msCrypto;

const buffer2hexa = buf => buf.map(b => ('00' + b.toString(16)).slice(-2)).join('');

const sha256 = async (message) => {
    // encode as UTF-8
    const msgBuffer = new TextEncoder('utf-8').encode(message);

    // hash the message
    const hashBuffer = await crypt.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = buffer2hexa(hashArray);
    return hashHex;
};

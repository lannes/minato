if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.ArrayUtils = require('../../util/ArrayUtils');
    global.KElliptic = require('../crypto/elliptic');
}

class TransactionInput {
    constructor(signature, txOutId, txOutIndex) {
        if (signature !== null && !(signature instanceof Uint8Array))
            throw Error('Invalid signature');

        if (txOutId !== null && !(txOutId instanceof Uint8Array))
            throw Error('Invalid txOutId');

        if (typeof txOutIndex !== 'number')
            throw Error('Invalid txOutIndex');

        this._signature = signature;
        this._txOutId = txOutId;
        this._txOutIndex = txOutIndex;
    }

    static clone(obj) {
        if (!obj)
            return obj;

        const signature = obj.signature;
        const txOutId = obj.txOutId;

        return new TransactionInput(signature, txOutId, obj.txOutIndex);
    }

    equals(obj) {
        return obj instanceof TransactionInput
            && ArrayUtils.equals(this._signature, obj.signature)
            && ArrayUtils.equals(this._txOutId, obj.txOutId)
            && this._txOutIndex === obj.txOutIndex;
    }

    get signature() {
        return this._signature;
    }

    get txOutId() {
        return this._txOutId;
    }

    get txOutIndex() {
        return this._txOutIndex;
    }

    serialize(buf) {
        buf = buf || new KBuffer(this.serializeSize);
        if (this._signature) {
            buf.writeUint8(1);
            buf.write(this._signature);
        } else {
            buf.writeUint8(0);
        }

        if (this._txOutId) {
            buf.writeUint8(1);
            buf.write(this._txOutId);
        } else {
            buf.writeUint8(0);
        }

        buf.writeUint32(this._txOutIndex);
        return buf;
    }

    static deserialize(buf) {
        let signature = null;
        const signaturePresent = buf.readUint8();
        if (signaturePresent)
            signature = buf.read(65);

        let txOutId = null;
        const txOutIdPresent = buf.readUint8();
        if (txOutIdPresent)
            txOutId = buf.read(32);

        const txOutIndex = buf.readUint32();
        return new TransactionInput(signature, txOutId, txOutIndex);
    }

    get serializeSize() {
        return 1 /* signaturePresent */
            + (this._signature ? 65 : 0) /* signature */
            + 1 /* txtOutIdPresent */
            + (this._txOutId ? 32 : 0) /* txtOutId */
            + 4 /* txtOutIndex */;
    }

    serializeContent(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        if (this._txOutId) {
            buf.writeUint8(1);
            buf.write(this._txOutId);
        } else {
            buf.writeUint8(0);
        }

        buf.writeUint32(this._txOutIndex);
        return buf;
    }

    get serializeContentSize() {
        return 1 /* txtOutIdPresent */
            + (this._txOutId ? 32 : 0) /* txtOutId */
            + 4 /* txtOutIndex */;
    }

    verify(id, unspentTxOuts) {
        const referencedUTxOut = unspentTxOuts.find(
            (tx) => ArrayUtils.equals(tx.txOutId, this._txOutId) && tx.txOutIndex === this._txOutIndex
        );
        if (referencedUTxOut == null) {
            console.log('referenced txOut not found: ');
            return false;
        }

        const address = referencedUTxOut.address;
        const publicKey = KElliptic.importPublicKey(address.value);
        const validSignature = KElliptic.verify(publicKey, this._signature, id);
        if (!validSignature) {
            console.log('invalid txIn signature: %s txId: %s address: %s',
                this._signature, id, referencedUTxOut.address);
            return false;
        }

        return true;
    }
}

if (typeof module !== 'undefined')
    module.exports = TransactionInput;


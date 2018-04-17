if (typeof require !== 'undefined') {
    global.KBuffer = require('../../util/Buffer');
    global.Hash = require('../common/Hash');
    global.Signature = require('../common/Signature');
    global.KElliptic = require('../crypto/elliptic');
}

class TransactionInput {
    constructor(signature, txOutId, txOutIndex) {
        if (!(signature instanceof Signature))
            throw Error('Invalid signature');

        if (!(txOutId instanceof Hash))
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

        const signature = Signature.clone(obj.signature);
        const txOutId = Hash.clone(obj.txOutId);

        return new TransactionInput(signature, txOutId, obj.txOutIndex);
    }

    equals(obj) {
        return obj instanceof TransactionInput
            && this._signature.equals(obj.signature)
            && this._txOutId.equals(obj.txOutId)
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

        this._signature.serialize(buf);
        this._txOutId.serialize(buf);
        buf.writeUint32(this._txOutIndex);

        return buf;
    }

    static deserialize(buf) {
        const signature = Signature.deserialize(buf);
        const txOutId = Hash.deserialize(buf);
        const txOutIndex = buf.readUint32();

        return new TransactionInput(signature, txOutId, txOutIndex);
    }

    get serializeSize() {
        return this._signature.serializeSize /* signature */
            + this._txOutId.serializeSize /* txtOutId */
            + 4 /* txtOutIndex */;
    }

    serializeContent(buf) {
        buf = buf || new KBuffer(this.serializeSize);

        this._txOutId.serialize(buf);
        buf.writeUint32(this._txOutIndex);

        return buf;
    }

    get serializeContentSize() {
        return this._txOutId.serializeSize /* txtOutId */
            + 4 /* txtOutIndex */;
    }

    verify(id, unspentTxOuts) {
        const referencedUTxOut = unspentTxOuts.find(
            (tx) => tx.txOutId.equals(this._txOutId) && tx.txOutIndex === this._txOutIndex
        );
        if (referencedUTxOut == null) {
            console.log('referenced txOut not found: ');
            return false;
        }

        const address = referencedUTxOut.address;
        const publicKey = KElliptic.importPublicKey(address.value);
        if (!this._signature.verify(publicKey, id.value)) {
            console.log(`invalid txIn signature: ${this._signature.hex} txId: ${id.hex} address: ${referencedUTxOut.address.hex}`);
            return false;
        }

        return true;
    }
}

if (typeof module !== 'undefined')
    module.exports = TransactionInput;


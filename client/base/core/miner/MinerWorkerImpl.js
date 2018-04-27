class MinerWorkerImpl extends IWorker.Stub(MinerWorker) {
    constructor() {
        super();
        this._superInit = super.init;
    }

    async init(name) {
        await this._superInit.call(this, name);
    }

    multiMine(input, difficult, minNonce, maxNonce) {
        let buffer = new KBuffer(input);
        return new Promise((resolve) => {

            buffer.writePos = buffer.byteLength;

            for (let nonce = minNonce; nonce < maxNonce; nonce++) {
                buffer.writePos -= 4;
                buffer.writeUint32(nonce);

                let hash = KHash.sha256(buffer);
                if (BlockUtils.isProofOfWork(hash, difficult)) {
                    resolve({ hash: hash, nonce: nonce });
                    return;
                }
            }

            resolve(null);
        });
    }
}

IWorker.prepareForWorkerUse(MinerWorker, new MinerWorkerImpl());


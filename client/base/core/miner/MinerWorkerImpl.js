class MinerWorkerImpl {
    mine(input, difficult, minNonce, maxNonce) {
        return new Promise((resolve, reject) => {

            input.writePos = input.byteLength;

            for (let nonce = minNonce; nonce < maxNonce; nonce++) {
                input.writePos -= 4;
                input.writeUint32(nonce);

                let hash = KHash.sha256(input);
                if (BlockUtils.isProofOfWork(hash, difficult)) {
                    resolve({ hash: hash, nonce: nonce });
                    return;
                }
            }

            resolve(null);
        });
    }
}
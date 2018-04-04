class MinerWorkerImpl {
    static mine(input, difficult, minNonce, maxNonce) {
        input.writePos = input.byteLength;

        for (let nonce = minNonce; nonce < maxNonce; nonce++) {
            input.writePos -= 4;
            input.writeUint32(nonce);

            let hash = KHash.sha256(input);
            if (BlockUtils.isProofOfWork(hash, difficult)) {
                return { hash: hash, nonce: nonce };
            }
        }

        return null;
    }
}
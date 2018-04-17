

GenesisConfig = {};
GenesisConfig.BASE_AMOUNT = 50;
GenesisConfig.GENESIS_AMOUNT = 1000000000;
GenesisConfig.GENESIS_TRANSACTION = new Transaction(
    Hash.fromHex('b33585bd8f9d99d3a90752dc25d1779c5c9c9af61abd94d6dc2a52908b2d662c'),
    [new TransactionInput(new Signature(null), new Hash(null), 0)],
    [new TransactionOutput(
        Address.fromBase64('BNM8vQ50sW72R+ZBRbjuidz8l0ppmh1BK9yjeUZISsGgVYb7ZWbtbWeU9ibZ7sHBdrn7HeKEs4pYcGJ+PI8paOo='),
        GenesisConfig.GENESIS_AMOUNT)
    ]
);
GenesisConfig.GENESIS_BLOCK = new Block(
    new BlockHeader(
        0,
        new Hash(null),
        Hash.fromHex('cfb8acc53564d6e6ab52a6a19b4838303bf7306a16e935675e4a2f3f18253ea5'),
        1519493046,
        0,
        1
    ),
    new BlockBody([GenesisConfig.GENESIS_TRANSACTION])
);
GenesisConfig.GENESIS_HASH = Hash.fromHex('e398c67160737ffdbb30d5859163618f4c9e1efd749bbf0086e2f2a3af49e83e');

console.log(GenesisConfig.GENESIS_TRANSACTION.getId().hex);
console.log((new BlockBody([GenesisConfig.GENESIS_TRANSACTION])).hash().hex);


let input = new KBuffer(GenesisConfig.GENESIS_BLOCK.header.serialize());
input.writePos = input.byteLength;

for (let nonce = 0; nonce < 100000; nonce++) {
    input.writePos -= 4;
    input.writeUint32(nonce);

    let hash = KHash.sha256(input);
    if (BlockUtils.isProofOfWork(hash, 0)) {
        console.log(`nonce: ${nonce} hash: ${(new Hash(hash)).hex}`);
        break;
    }
}

console.log(GenesisConfig.GENESIS_BLOCK.verify());



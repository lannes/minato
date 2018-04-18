if (typeof require !== 'undefined') {
    global.Hash = require('../common/Hash');
    global.Signature = require('../common/Signature');
    global.Address = require('../common/Address');
    global.Transaction = require('../transaction/Transaction');
    global.TransactionInput = require('../transaction/TransactionInput');
    global.TransactionOutput = require('../transaction/TransactionOutput');
    global.Block = require('../block/Block');
    global.BlockHeader = require('../block/BlockHeader');
    global.BlockBody = require('../block/BlockBody');
}

//const keys = KElliptic.generateKeyPair();
//console.log(ArrayUtils.toBase64(keys.public));

GenesisConfig = {};
GenesisConfig.BASE_AMOUNT = 50;
GenesisConfig.GENESIS_AMOUNT = 1000000000;
GenesisConfig.GENESIS_TRANSACTION = new Transaction(
    Hash.fromHex('078abd96498fbf8e46830d672385a42b568b7501b4abc2163599b3b39fdec3ca'),
    [new TransactionInput(new Signature(null), new Hash(null), 0)],
    [new TransactionOutput(
        Address.fromBase64('aW68vgBk2VuDW1ralVScF+rhPMRDRIV5FUbZKZPPd2g='),
        GenesisConfig.GENESIS_AMOUNT)
    ]
);
GenesisConfig.GENESIS_BLOCK = new Block(
    new BlockHeader(
        0,
        new Hash(null),
        Hash.fromHex('102113b1622da21fa972ed94717de78d90602ce16412ed3ee80e3d7166c45f6a'),
        1519493046,
        0,
        2
    ),
    new BlockBody([GenesisConfig.GENESIS_TRANSACTION])
);
GenesisConfig.GENESIS_HASH = Hash.fromHex('e78136ea3c366cb3c6aa469f0030931051751d97f92ba55a558f658e39cc6c19');

/*
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
*/

if (typeof module !== 'undefined')
    module.exports = GenesisConfig;



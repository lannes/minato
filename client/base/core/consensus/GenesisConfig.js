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
GenesisConfig.MINING_REWARD = 50;
GenesisConfig.FEE_PER_TRANSACTION = 1;
GenesisConfig.GENESIS_AMOUNT = 1000000000;
GenesisConfig.GENESIS_TRANSACTION = new Transaction(
    Hash.fromHex('b21dd2e4b3b8ffc3f9ab30cefe5753bf100ee56a92f1780d426e52bde417ebe6'),
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
        Hash.fromHex('a097a52475c5dd3f4307d25c37295dc844562c46a95fad098e9bee78c5cfbb96'),
        1519493046,
        0,
        0
    ),
    new BlockBody([GenesisConfig.GENESIS_TRANSACTION])
);
GenesisConfig.GENESIS_HASH = Hash.fromHex('9a58ba3a2024863f6a4f2bffb44c11327fdce0368432b07dd9a895c490101490');


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


if (typeof module !== 'undefined')
    module.exports = GenesisConfig;



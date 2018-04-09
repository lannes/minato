

GenesisConfig = {};
GenesisConfig.BASE_AMOUNT = 50;
GenesisConfig.GENESIS_AMOUNT = 1000000000;
GenesisConfig.GENESIS_TRANSACTION = new Transaction(
    Hash.fromHex('994b584787ef87c58f17a348e6a140e36591e9f0e99851b6951317a204f6e561'),
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
        Hash.fromHex('eea586e640b51f4a7a4e6f80aa8b5eab02a24950f99a03958761612943e9f5e3'),
        1519493046,
        0,
        0
    ),
    new BlockBody([GenesisConfig.GENESIS_TRANSACTION])
);
GenesisConfig.GENESIS_HASH = Hash.fromHex('f7ff34faf1bd4d30f5041d0180d07b5b6d0b000123761a0846c8358748f8f1d7');

console.log(GenesisConfig.GENESIS_TRANSACTION.getId().hex);
console.log((new BlockBody([GenesisConfig.GENESIS_TRANSACTION])).hash().hex);
console.log(GenesisConfig.GENESIS_BLOCK.hash().hex);
console.log(GenesisConfig.GENESIS_BLOCK.verify());



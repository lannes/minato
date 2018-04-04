GenesisConfig = {};
GenesisConfig.BASE_AMOUNT = 50;
GenesisConfig.GENESIS_AMOUNT = 1000000000;
GenesisConfig.GENESIS_TRANSACTION = new Transaction(
    ArrayUtils.fromHex('ba68666bec514d59a0738d67cc7e2c5798a6808271439f3a7249ad753ed78a2c'),
    [new TransactionInput(null, null, 0)],
    [new TransactionOutput(
        Address.fromBase64('BNM8vQ50sW72R+ZBRbjuidz8l0ppmh1BK9yjeUZISsGgVYb7ZWbtbWeU9ibZ7sHBdrn7HeKEs4pYcGJ+PI8paOo='),
        GenesisConfig.GENESIS_AMOUNT)
    ]
);
GenesisConfig.GENESIS_BLOCK = new Block(
    new BlockHeader(
        0,
        null,
        ArrayUtils.fromHex('4cf2e78cd040f1c8ff7ad89d7365c3aa3c4c9eadaf81b4e5562d4f7fb9d00452'),
        1519493046,
        0,
        0
    ),
    new BlockBody([GenesisConfig.GENESIS_TRANSACTION])
);

console.log(ArrayUtils.toHex(GenesisConfig.GENESIS_TRANSACTION.getId()));
console.log(ArrayUtils.toHex((new BlockBody([GenesisConfig.GENESIS_TRANSACTION])).hash()));




const save = async (blockchain) => {
    await Database.addList('blockchain', blockchain);
};

const syncLocal = async () => {
    let blockchain = await Database.getAll('blockchain');

};

const syncOverall = async () => {
    let bestChain = syncLocal();

    //for peer in PEERS:
    //#try to connect to peer
    //synchronous requests

    //#for now, save the new blockchain over whatever was there

};

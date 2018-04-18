if (typeof require !== 'undefined') {
    global.Wallet = require('../Wallet');
}

class Account {
    static findUnspentTxOuts(address, unspentTxOuts) {
        return unspentTxOuts.filter((tx) => tx.address.equals(address));
    }

    static getBalance(address, unspentTxOuts) {
        const uTxOs = Account.findUnspentTxOuts(address, unspentTxOuts);
        return uTxOs.reduce((sum, tx) => sum + tx.amount, 0);
    }

    static getMyBalance(unspentTxOuts) {
        const address = Wallet.address;
        return Account.getBalance(address, unspentTxOuts);
    }

    static getMyUnspentTransactionOutputs(unspentTxOuts) {
        return Account.findUnspentTxOuts(Wallet.address, unspentTxOuts);
    }
}

if (typeof module !== 'undefined')
    module.exports = Account;





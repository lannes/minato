if (typeof require !== 'undefined') {
    global.Observable = require('../../utils/Observable');
    global.GenesisConfig = require('../consensus/GenesisConfig');
}

class BaseChain extends Observable {
    constructor() {
        super();
    }

    getBlockLocators() {
        const locators = [this.headHash];

        let block = this.head;
        for (let i = Math.min(10, this.height) - 1; i > 0; i--) {
            if (!block) {
                break;
            }

            locators.push(block.prevHash);
            block = this.getBlock(block.prevHash);
        }

        let step = 2;
        for (let i = this.height - 10 - step; i > 0; i -= step) {
            block = this.getBlockAt(i);
            if (block) {
                locators.push(block.hash());
            }
            step *= 2;
        }

        if (locators.length === 0 || !locators[locators.length - 1].equals(GenesisConfig.GENESIS_HASH)) {
            locators.push(GenesisConfig.GENESIS_HASH);
        }

        return locators;
    }
}

if (typeof module !== 'undefined')
    module.exports = BaseChain;
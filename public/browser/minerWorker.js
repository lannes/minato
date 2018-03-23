importScripts(
    './crypto/sjcl.js?v=0.1',
    './crypto/hash.js?v=0.1',
    '../base/util/buffer.js?v=0.1',
    '../base/util/common.js?v=0.1',
    '../base/util/observable.js?v=0.1',
    '../base/core/miner/miner.js?v=0.1',
);

let minerPort = null;
let miner = new Miner();

miner.on('hashrate', (hashrate) => minerPort.postMessage({ 'cmd': 'hashrate', 'msg': hashrate }));
miner.on('block', (block) => minerPort.postMessage({ 'cmd': 'block', 'msg': block }));
miner.on('state', (state) => minerPort.postMessage({ 'cmd': '' }));

const onMessageFromNode = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'mine': {
            let block = data['msg'];
            miner.start(block);
        }
            break;
        case 'pause':
            miner.stop();
            break;
    }
};

this.onmessage = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'connect':
            minerPort = event.ports[0];
            minerPort.onmessage = onMessageFromNode;
            break;
        default:
            break;
    }
};

this.onerror = (e) => {
    console.log(e.message + ' (' + e.filename + ':' + e.lineno + ')');
};

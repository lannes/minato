importScripts(
    '../../util/hash.js',
    '../../util/common.js',
    '../../util/observable.js'
);

importScripts(
    './miner.js',
);

let minerPort = null;
let miner = new Miner();

miner.on('hashrate', (hashrate) => minerPort.postMessage({ 'cmd': 'hashrate', 'msg': hashrate }));
miner.on('newblock', (block) => minerPort.postMessage({ 'cmd': 'newblock', 'msg': block }));

const onMessageFromCore = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'mine': {
            let block = data['msg'];
            await miner.start(block);
        }
            break;
        default:
            break;
    }
};

this.onmessage = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'connect':
            minerPort = event.ports[0];
            minerPort.onmessage = onMessageFromCore;
            break;
        default:
            break;
    }
};

this.onerror = (e) => {
    console.log(e.message + ' (' + e.filename + ':' + e.lineno + ')');
};

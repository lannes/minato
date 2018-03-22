importScripts(
    '../util/hash.js',
    '../util/common.js',
    '../util/observable.js',
    '../core/miner/miner.js',
);

let minerPort = null;
let miner = new Miner();

miner.on('hashrate', (hashrate) => minerPort.postMessage({ 'cmd': 'hashrate', 'msg': hashrate }));
miner.on('block', (block) => minerPort.postMessage({ 'cmd': 'block', 'msg': block }));
miner.on('state', (state) => minerPort.postMessage({ 'cmd': '' }));

const onMessageFromNode = async (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'mine': {
            let block = data['msg'];
            await miner.start(block);
        }
            break;
        case 'pause':
            miner.stop();
            break;
    }
};

this.onmessage = async (event) => {
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

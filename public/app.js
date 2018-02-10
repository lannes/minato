const formatNumber = (number) => {
    let result = number.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

let webp2p = null;
const initp2p = () => {
    let signalingServer = 'ws://localhost:3002';
    if (location.host != 'localhost:3001')
        signalingServer = 'wss://' + location.host + '/minato';

    const configuration = {
        'iceServers': [
            { 'urls': 'stun:stun.l.google.com:19302' }
        ]
    };

    webp2p = new WebP2P(signalingServer, configuration);

    webp2p.onopen = (id) => {
        console.log('open connect to ' + id);
        worker.postMessage({ 'cmd': 'p2p', 'id': id, 'type': 'open' });
    }

    webp2p.onmessage = (id, message) => {
        //console.log('received from: ' + id + ' ' + message);
        try {
            let data = JSON.parse(message);
            worker.postMessage({ 'cmd': 'p2p', 'id': id, 'type': 'data', 'msg': data });
        } catch (e) {
            console.log(e);
        }
    }

    webp2p.onclose = (id) => {
        console.log('close connect with ' + id);
    }
}

const worker = new Worker('worker.js');

worker.onmessage = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'init':
            $('#lblMyAddress').html(data['msg']);
            initp2p();
            break;
        case 'balance': {
            let balance = formatNumber(data['msg']);
            $('#lblBalance').html(balance);
        }
            break;
        case 'p2p': {
            if (data['msg'].length == 2) {
                const msg = data['msg'][1];
                webp2p.send(data['msg'][0], JSON.stringify(msg));
            } else {
                const msg = data['msg'][0];
                webp2p.broadcast(JSON.stringify(msg));
            }
        }
            break;
    }
};

worker.onerror = (event) => {
    console.log(event);
};

const start = () => {
    worker.postMessage({ 'cmd': 'init' });
};

const execute = (cmd) => {
    worker.postMessage(cmd);
};
const formatNumber = (number) => {
    let result = number.toFixed(0).replace(/./g, (c, i, a) => {
        return i > 0 && c !== '.' && (a.length - i) % 3 === 0 ? ',' + c : c;
    });

    return result;
};

let webp2p = null;
let connections = 0;
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
        connections++;
        $('#lblConnections').text(connections);
        worker.postMessage({ 'cmd': 'p2p', 'id': id, 'type': 'open' });
    };

    webp2p.onprogress = (id, percent) => {
        $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
    };

    webp2p.onmessage = (id, message) => {
        //console.log('received from: ' + id + ' ' + message);
        try {
            let data = JSON.parse(message);
            worker.postMessage({ 'cmd': 'p2p', 'id': id, 'type': 'data', 'msg': data });
        } catch (e) {
            console.log(e);
        }
    };

    webp2p.onclose = (id) => {
        connections--;
        $('#lblConnections').text(connections);
    }
}

const worker = new Worker('worker.js');

worker.onmessage = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'init':
            $('#lblMyAddress').text(data['msg']);
            initp2p();
            break;
        case 'download':
            if (data['msg'] === 0) {
                $('#pgDownload').show();
            } else if (data['msg'] === 1) {
                $('#pgDownload').hide();
            }
            break;
        case 'consensus':

            break;
        case 'block':
            $('#lblBlock').text(data['msg']);
            break;
        case 'balance': {
            let balance = formatNumber(data['msg']);
            $('#lblBalance').text(balance);
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
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

    webp2p.onopen = (id, connections) => {
        $('#lblConnections').text(connections);
        execute({ 'cmd': 'p2p', 'id': id, 'type': 'open' });
    };

    webp2p.onprogress = (id, percent) => {
        $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
    };

    webp2p.onmessage = (id, message) => {
        //console.log('received from: ' + id + ' ' + message);
        try {
            let data = JSON.parse(message);
            execute({ 'cmd': 'p2p', 'id': id, 'type': 'data', 'msg': data });
        } catch (e) {
            console.log(e);
        }
    };

    webp2p.onclose = (id, connections) => {
        $('#lblConnections').text(connections);
    }
}

const node = new Worker('./core/node.js');
const miner = new Worker('./core/miner/minerWorker.js');
const channel = new MessageChannel();

node.postMessage({ 'cmd': 'connect', }, [channel.port1]);
miner.postMessage({ 'cmd': 'connect', }, [channel.port2]);

node.onmessage = (event) => {
    const data = event.data;
    switch (data['cmd']) {
        case 'init':
            $('#lblAccount').text(data['msg']);
            initp2p();
            break;
        case 'download':
            if (data['msg']['state'] === 0) {
                $('#pgDownload').show();
            } else if (data['msg']['state'] === 1) {
                $('#pgDownload').hide();
            }
            break;
        case 'consensus':

            break;
        case 'hashrate': {
            const hashrate = data['msg'] + ' H/s';
            $('#lblMyHashrate').text(hashrate);
        }
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

                if (msg['type'] === 3)
                    console.log('send blockchain');

                webp2p.send(data['msg'][0], JSON.stringify(msg));
            } else {
                const msg = data['msg'][0];
                webp2p.broadcast(JSON.stringify(msg));
            }
        }
            break;
    }
};

node.onerror = (event) => {
    console.log(event);
};

const start = () => {
    execute({ 'cmd': 'init' });
};

const execute = (cmd) => {
    node.postMessage(cmd);
};
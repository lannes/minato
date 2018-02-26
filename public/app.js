const formatBalance = (number) => {
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
        execute({ 'cmd': 'network', 'id': id, 'type': 'open' });
    };

    webp2p.onprogress = (id, percent) => {
        $('#barDownload').css('width', percent + '%').attr('aria-valuenow', percent).text(percent + '%');
    };

    webp2p.onmessage = (id, message) => {
        //console.log('received from: ' + id + ' ' + message);
        try {
            let data = JSON.parse(message);
            execute({ 'cmd': 'network', 'id': id, 'type': 'data', 'msg': data });
        } catch (e) {
            console.log(e);
        }
    };

    webp2p.onclose = (id, connections) => {
        $('#lblConnections').text(connections);
    }
}

if (typeof (window.Worker) === 'undefined') {
    alert('No Web Worker support');
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
        case 'sync':
            if (data['msg']['state'] === 0) {
                $('#pgDownload').show();
            }

            if (data['msg']['state'] === 5) {
                $('#pgDownload').hide();
            }
            break;
        case 'hashrate': {
            const hashrate = data['msg'] + ' H/s';
            $('#lblMyHashrate').text(hashrate);
        }
            break;
        case 'height':
            $('#lblBlock').text(data['msg']);
            break;
        case 'balance': {
            let balance = formatBalance(data['msg']);
            $('#lblBalance').text(balance);
            $('#lblAmount').text(balance);
        }
            break;
        case 'network': {
            if (data['msg'].length !== 2)
                return;

            const id = data['msg'][0];
            const msg = data['msg'][1];
            if (id === 0)
                webp2p.broadcast(JSON.stringify(msg));
            else
                webp2p.send(id, JSON.stringify(msg));
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
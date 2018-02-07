let webp2p = null;
const initp2p = () => {
    //const signalingServer = 'wss://www.minato.zone/minato';
    const signalingServer = 'ws://localhost:3002';

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
        if (!message)
            return;

        console.log('received from: ' + id + ' ' + message);
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
            $('#lblMyAddress').html(data['public']);
            initp2p();
            break;
        case 'p2p': {
            const id = data['id'];
            const msg = JSON.stringify(data['msg']);

            if (id) {
                webp2p.send(id, msg);
            } else {
                webp2p.broadcast(msg);
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
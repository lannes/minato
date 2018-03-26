class WebRTC {
    constructor(signalingServer, cfgIceServers) {
        this.pcs = {};
        this.channelCount = 0;
        this.id = '';
        this.intervalId = null;
        this.signalingServer = signalingServer;
        this.cfgIceServers = cfgIceServers;

        this._connect(true);
    }

    _connect(first) {
        let url = this.signalingServer;
        if (this.id != '' && !first)
            url += '?id=' + this.id;

        this.signalingChannel = new WebSocket(url);

        this.signalingChannel.onopen = (event) => {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        };

        this.signalingChannel.onclose = (event) => {
            this._reconnectSignalingChannel();
        };

        this.signalingChannel.onerror = (event) => {
            console.log('signalingChannel error: ' + event);
        };

        this.signalingChannel.onmessage = this._signaling.bind(this);
    }

    _reconnectSignalingChannel() {
        if (this.intervalId)
            return;

        this.intervalId = setInterval(() => {
            console.log('SignalingChannel: reconnecting...');
            this._connect(false);
        }, 5000);
    }

    _control(pc) {
        pc.on('onprogress', (msg) => this.onprogress(msg.id, msg.data));
        pc.on('onmessage', (msg) => this.onmessage(msg.id, msg.data));
    }

    async _signaling(event) {
        const message = JSON.parse(event.data);
        if (!(message instanceof Array))
            return;

        if (message.length <= 1)
            return;

        let self = this;

        switch (message[0]) {
            case 'id':
                this.id = message[1];
                console.log(this.id);
                break;
            case 'clients':
                break;
            case 'initiator': {
                const id = message[1];
                if (!this.pcs[id] ||
                    (this.pcs[id] && this.pcs[id].pc && this.pcs[id].pc.iceConnectionState === 'disconnected')) {
                    let pc = new PeerConnectionSender(id, this.signalingChannel, this.cfgIceServers);

                    this._control(pc);

                    pc.createOffer();

                    this.pcs[id] = pc;
                }
            }
                break;
            case 'data': {
                const id = message[1];
                const data = message[2];

                if (data['sdp']) {
                    if (data['type'] === 'offer') {
                        let pc = new PeerConnectionReceiver(id, this.signalingChannel, this.cfgIceServers);

                        this._control(pc);

                        pc.receiveOffer();
                        pc.createAnswer(data);

                        this.pcs[id] = pc;
                    } else if (data['type'] === 'answer') {
                        this.pcs[id].receiveAnswer(data);
                    }
                } else if (data['candidate']) {
                    if (this.pcs[id])
                        this.pcs[id].addIceCandidate(data);
                }
                break;
            }
        }
    }
}

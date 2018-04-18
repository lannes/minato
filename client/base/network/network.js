
if (typeof require !== 'undefined') {
    global.WebSocket = require('ws');
    global.webrtc = require('wrtc');
    global.WebRtcDataChannel = require('./webrtc/WebRtcDataChannel');

    global.RTCPeerConnection = webrtc.RTCPeerConnection;
    global.RTCSessionDescription = webrtc.RTCSessionDescription;
    global.RTCIceCandidate = webrtc.RTCIceCandidate;
} else {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
}

//const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
//const isFirefox = typeof InstallTrigger !== 'undefined';

class KNetwork {
    constructor(signalingServer, cfgIceServers) {
        this.pcs = {};
        this.dataChannels = {};
        this.channelCount = 0;
        this.timeouts = {};
        this.timeoutTime = 2 * 1000;
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

    disconnect() {
        for (let id in self.pcs) {
            this._disconnect(id);
        }
    }

    broadcast(msg) {
        for (let id in this.dataChannels) {
            this.send(id, msg);
        }
    }

    send(id, msg) {
        if (this.dataChannels[id])
            this.dataChannels[id].send(msg);
    }

    _signaling(event) {
        const message = JSON.parse(event.data);
        if (!(message instanceof Array))
            return;

        if (message.length <= 1)
            return;

        switch (message[0]) {
            case 'id':
                this.id = message[1];
                this.onconnect(this.id);
                console.log(this.id);
                break;
            case 'clients':
                break;
            case 'initiator': {
                const id = message[1];
                if (!this.pcs[id] ||
                    (this.pcs[id] && this.pcs[id].pc && this.pcs[id].pc.iceConnectionState === 'disconnected')) {
                    this._createOffer(id);
                }
            }
                break;
            case 'data': {
                const id = message[1];
                const data = message[2];

                if (data['sdp']) {
                    if (data['type'] === 'offer') {
                        this._receiveOffer(id);
                        this._createAnswer(id, data);
                    } else if (data['type'] === 'answer') {
                        if (this.pcs[id])
                            this.pcs[id].pc.setRemoteDescription(new RTCSessionDescription(data)).catch((e) => {
                                console.log(e);
                            });
                    }
                } else if (data['candidate']) {
                    if (this.pcs[id].pc)
                        this.pcs[id].pc.addIceCandidate(new RTCIceCandidate(data)).catch(e => console.log(e));
                }
            }
                break;
        }
    }

    _setupDataChannel(id, nativeChannel) {
        const channel = new WebRtcDataChannel(nativeChannel);

        channel.on('open', (message) => {
            console.log('dataChannel open [%s]', id);

            this.channelCount++;
            this.onopen(id, this.channelCount);

            if (this.timeouts[id])
                clearTimeout(this.timeouts[id]);
        });

        channel.on('message', (message) => this.onmessage(id, message));
        channel.on('close', () => this._disconnect(id));
        channel.on('error', (e) => console.log(e));

        this.dataChannels[id] = channel;
    }

    _initPeerConnection(id, creator) {
        if (this.pcs[id]) {
            delete this.pcs[id].pc;
            this.pcs[id].pc = new RTCPeerConnection(this.cfgIceServers);
            this.pcs[id].retry++;
        } else {
            this.pcs[id] = {
                pc: new RTCPeerConnection(this.cfgIceServers),
                creator: creator,
                retry: 0
            };
        }

        let self = this;
        /*
        this.timeouts[id] = setTimeout(() => {
            self.disconnect(id);
        }, this.timeoutTime);
        */

        let pc = this.pcs[id].pc;
        pc.oniceconnectionstatechange = () => {
            if (!self.pcs[id])
                return;

            console.log(pc.iceConnectionState + ' ' + id);

            if (pc.iceConnectionState === 'connected') {
            }

            if (pc.iceConnectionState === 'failed') {
                const creator = self.pcs[id].creator;

                if (creator) {
                    if (self.pcs[id].retry < 2) {
                        self._createOffer(id);
                    } else {
                        console.log('failed %d times', self.pcs[id].retry);
                        self._disconnect(id);
                    }
                }
            } else if (pc.iceConnectionState === 'disconnected') {
                self.channelCount--;
                self._disconnect(id);
                self.onclose(id, self.channelCount);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                self.signalingChannel.send(JSON.stringify(['data', id, event.candidate]));
            }
        };
    }

    _receiveOffer(id) {
        this._initPeerConnection(id, false);

        this.pcs[id].pc.ondatachannel = (event) => {
            let channel = event.channel;
            channel.binaryType = 'arraybuffer';

            this._setupDataChannel(id, channel);
        };
    }

    _createOffer(id) {
        this._initPeerConnection(id, true);

        let self = this;
        let pc = this.pcs[id].pc;

        let channel = pc.createDataChannel(id);
        channel.binaryType = 'arraybuffer';

        this._setupDataChannel(id, channel);

        pc.createOffer().then((offer) => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            self.signalingChannel.send(JSON.stringify(['data', id, pc.localDescription]));
        }).catch((e) => {
            console.log(e);
        });
    }

    _createAnswer(id, sdp) {
        let self = this;
        let pc = this.pcs[id].pc;
        pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            return pc.createAnswer();
        }).then(answer => {
            return pc.setLocalDescription(answer);
        }).then(() => {
            self.signalingChannel.send(JSON.stringify(['data', id, pc.localDescription]));
        }).catch((e) => {
            console.log(e);
        });
    }

    _disconnect(id) {
        if (this.dataChannels[id])
            this.dataChannels[id].close();
        delete this.dataChannels[id];

        if (!this.pcs[id])
            return;

        if (this.pcs[id].pc)
            this.pcs[id].pc.close();
        delete this.pcs[id];
    }
}

if (typeof module !== 'undefined')
    module.exports = KNetwork;

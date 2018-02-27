window.WebSocket = window.WebSocket || window.MozWebSocket;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

const CHUNK_SIZE = 16 * 1024;

const numberToByteArray = (number) => {
    let bytes = [];

    do {
        bytes.push(number & 0xFF);
        number >>= 8;
    } while (number > 0);

    return bytes;
};

const byteArrayToNumber = (bytes) => {
    let number = 0;

    for (let i = bytes.length - 1; i >= 0; i--) {
        number <<= 8;
        number |= bytes[i];
    }

    return number;
};

class WebP2P {
    constructor(signalingServer, cfgIceServers) {
        this.pcs = {};
        this.dataChannels = {};
        this.channelCount = 0;
        this.chunks = {};
        this.timeouts = {};
        this.timeoutTime = 2 * 1000;
        this.id = '';
        this.signalingServer = signalingServer;
        this.cfgIceServers = cfgIceServers;

        this._start();
    }

    _start() {
        this.signalingChannel = new WebSocket(this.signalingServer);

        let self = this;

        this.signalingChannel.onopen = (event) => {
            if (self.id != '')
                self.signalingChannel.send(JSON.stringify(['id', self.id]));
        };

        this.signalingChannel.onclose = (event) => {
            self._reconnectSignalingChannel();
        };

        this.signalingChannel.onerror = (event) => {
            console.log('signalingChannel error: ' + event);
        };

        this.signalingChannel.onmessage = this._signaling.bind(this);
    }

    _reconnectSignalingChannel() {
        let self = this;
        setTimeout(() => {
            console.log('SignalingChannel: reconnecting...');
            self._start();
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
        const nChunks = Math.floor(msg.length / CHUNK_SIZE);
        const remainder = msg.length - (nChunks * CHUNK_SIZE);

        let result = this._sendChunk(id, new Uint8Array(numberToByteArray(msg.length)));

        for (let i = 0; i < nChunks; i++) {
            const chunk = msg.substr(i * CHUNK_SIZE, CHUNK_SIZE);
            result = this._sendChunk(id, chunk);
            if (!result)
                break;
        }

        if (result && remainder > 0) {
            result = this._sendChunk(id, msg.substr(nChunks * CHUNK_SIZE, remainder));
        }

        return result;
    }

    _sendChunk(id, msg) {
        if (this.dataChannels[id]) {
            if (this.dataChannels[id].readyState == 'open') {
                try {
                    this.dataChannels[id].send(msg);
                    return true;
                } catch (e) {
                    console.log(e);
                }
            }
        } else {
            this._disconnect(id);
        }

        return false;
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
                console.log(this.id);
                break;
            case 'clients':
                break;
            case 'initiator': {
                const id = message[1];
                this._createOffer(id);
            }
                break;
            case 'sdp': {
                const id = message[1];
                const sdp = message[2];

                if (sdp.type === 'offer') {
                    this._receiveOffer(id);
                    this._createAnswer(id, sdp);
                } else if (sdp.type === 'answer') {
                    if (this.pcs[id])
                        this.pcs[id].pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch((e) => {
                            console.log(e);
                        });
                }
            }
                break;
            case 'candidate': {
                const id = message[1];
                const candidate = message[2];

                if (this.pcs[id].pc)
                    this.pcs[id].pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log(e));
            }
                break;
        }
    }

    _setupDataChannel(id) {
        let self = this;
        this.dataChannels[id].onopen = () => {
            self.channelCount++;
            self.onopen(id, self.channelCount);

            if (self.timeouts[id])
                clearTimeout(self.timeouts[id]);
        };

        this.dataChannels[id].onmessage = (event) => {
            let data = event.data;

            if (typeof (data) === 'string') {
                self.chunks[id].data += data;

                const percent = (self.chunks[id].data.length * 100) / self.chunks[id].size;
                self.onprogress(id, Math.floor(percent));

                if (self.chunks[id].data.length === self.chunks[id].size) {
                    self.onmessage(id, self.chunks[id].data);
                }
            } else {
                const bytes = new Uint8Array(data);
                const size = byteArrayToNumber(bytes);
                self.chunks[id] = { size: size, data: '' };
            }
        };

        this.dataChannels[id].onclose = () => {
        };
    }

    _initPeerConnection(id, creator) {
        if (this.pcs[id]) {
            delete this.pcs[id].pc;
            this.pcs[id].pc = new RTCPeerConnection(this.cfgIceServers);
            this.pcs[id].retry = this.pcs[id].retry + 1;
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

        this.pcs[id].pc.oniceconnectionstatechange = () => {
            if (!self.pcs[id])
                return;

            console.log(self.pcs[id].pc.iceConnectionState + ' ' + id);

            if (self.pcs[id].pc.iceConnectionState == 'connected') {
            }

            if (self.pcs[id].pc.iceConnectionState == 'failed') {
                const creator = self.pcs[id].creator;

                if (creator) {
                    if (self.pcs[id].retry < 2) {
                        self._createOffer(id);
                    } else {
                        console.log('failed %d times', self.pcs[id].retry);
                        self._disconnect(id);
                    }
                }
            } else if (self.pcs[id].pc.iceConnectionState == 'disconnected') {
                self.channelCount--;
                self._disconnect(id);
                self.onclose(id, self.channelCount);
            }
        };

        this.pcs[id].pc.onicecandidate = (event) => {
            if (event.candidate) {
                self.signalingChannel.send(JSON.stringify(['candidate', id, event.candidate]));
            }
        };
    }

    _receiveOffer(id) {
        this._initPeerConnection(id, false);

        let self = this;
        this.pcs[id].pc.ondatachannel = (event) => {
            self.dataChannels[id] = event.channel;
            self._setupDataChannel(id);
        };
    }

    _createOffer(id) {
        this._initPeerConnection(id, true);

        let self = this;
        this.pcs[id].pc.onnegotiationneeded = () => {
            self.pcs[id].pc.createOffer().then((offer) => {
                return self.pcs[id].pc.setLocalDescription(offer);
            }).then(() => {
                self.signalingChannel.send(JSON.stringify(['sdp', id, self.pcs[id].pc.localDescription]));
            }).catch((e) => {
                console.log(e);
            });
        };

        this.dataChannels[id] = this.pcs[id].pc.createDataChannel('minato_' + id);
        this._setupDataChannel(id);
    }

    _createAnswer(id, sdp) {
        let self = this;
        this.pcs[id].pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            return self.pcs[id].pc.createAnswer();
        }).then((answer) => {
            return self.pcs[id].pc.setLocalDescription(answer);
        }).then(() => {
            self.signalingChannel.send(JSON.stringify(['sdp', id, self.pcs[id].pc.localDescription]));
        }).catch((e) => {
            console.log(e);
        });
    }

    _disconnect(id) {
        if (this.dataChannels[id])
            this.dataChannels[id].close();
        delete this.dataChannels[id];

        if (this.pcs[id].pc)
            this.pcs[id].pc.close();
        delete this.pcs[id];
    }
}

window.WebSocket = window.WebSocket || window.MozWebSocket;

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
        this.chunks = {};
        this.timeouts = {};
        this.timeoutTime = 2 * 1000;
        this.id = '';
        this.cfgIceServers = cfgIceServers;

        this.signalingChannel = new WebSocket(signalingServer);

        this.signalingChannel.onopen = (event) => {

        }

        let self = this;
        this.signalingChannel.onclose = (event) => {
            console.log('signalingChannel close');
        }

        this.signalingChannel.onerror = (event) => {
            console.log('signalingChannel error: ' + event);
        }

        this.signalingChannel.onmessage = this._signaling.bind(this);
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
        console.log('begin send ' + msg.length);
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

        console.log('end send ' + msg.length);
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
                let id = message[1];
                let sdp = message[2];

                if (sdp.type === 'offer') {
                    this._receiveOffer(id);
                    this._createAnswer(id, sdp);
                } else if (sdp.type === 'answer') {
                    if (this.pcs[id])
                        this.pcs[id].setRemoteDescription(new RTCSessionDescription(sdp)).catch((e) => {
                            console.log(e);
                        });
                }
            }
                break;
            case 'candidate': {
                let id = message[1];
                let candidate = message[2];

                if (this.pcs[id])
                    this.pcs[id].addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log(e));
            }
                break;
        }
    }

    _setupDataChannel(id) {
        let self = this;
        this.dataChannels[id].onopen = () => {
            self.onopen(id);
            self.broadcast('p2p_open');
        };

        this.dataChannels[id].onmessage = (event) => {
            let data = event.data;

            if (typeof (data) === 'string') {
                this.chunks[id].data += data;
                if (this.chunks[id].data.length === this.chunks[id].size) {
                    switch (this.chunks[id].data) {
                        case 'p2p_open':
                            if (self.timeouts[id])
                                clearTimeout(self.timeouts[id]);
                            break;
                        case 'p2p_close':
                            break;
                        default:
                            self.onmessage(id, this.chunks[id].data);
                            break;
                    }
                }
            } else {
                const bytes = new Uint8Array(data);
                const size = byteArrayToNumber(bytes);
                this.chunks[id] = { size: size, data: '' };
            }
        };

        this.dataChannels[id].onclose = () => {
            self.onclose(id);
        };
    }

    _initPeerConnection(id) {
        this.pcs[id] = new RTCPeerConnection(this.cfgIceServers);

        let self = this;
        /*
        this.timeouts[id] = setTimeout(() => {
            self.disconnect(id);
        }, this.timeoutTime);
        */

        this.pcs[id].onicecandidate = (event) => {
            if (event.candidate) {
                self.signalingChannel.send(JSON.stringify(['candidate', id, event.candidate]));
            }
        };
    }

    _receiveOffer(id) {
        this._initPeerConnection(id);

        let self = this;
        this.pcs[id].ondatachannel = (event) => {
            self.dataChannels[id] = event.channel;
            self._setupDataChannel(id);
        };
    }

    _createOffer(id) {
        this._initPeerConnection(id);

        let self = this;
        this.pcs[id].onnegotiationneeded = () => {
            self.pcs[id].createOffer().then((offer) => {
                return self.pcs[id].setLocalDescription(offer);
            }).then(() => {
                self.signalingChannel.send(JSON.stringify(['sdp', id, self.pcs[id].localDescription]));
            }).catch((e) => {
                console.log(e);
            });
        };

        this.dataChannels[id] = this.pcs[id].createDataChannel('minato_' + id);
        this._setupDataChannel(id);
    }

    _createAnswer(id, sdp) {
        let self = this;
        this.pcs[id].setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            return self.pcs[id].createAnswer();
        }).then((answer) => {
            return self.pcs[id].setLocalDescription(answer);
        }).then(() => {
            self.signalingChannel.send(JSON.stringify(['sdp', id, self.pcs[id].localDescription]));
        }).catch((e) => {
            console.log(e);
        });
    }

    _disconnect(id) {
        if (this.dataChannels[id])
            this.dataChannels[id].close();
        delete this.dataChannels[id];

        if (this.pcs[id])
            this.pcs[id].close();
        delete this.pcs[id];
    }
}

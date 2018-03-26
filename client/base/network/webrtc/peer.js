class PeerConnection extends Observable {
    constructor(id, signalingChannel, cfgIceServers) {
        super();

        this.id = id;
        this.signalingChannel = signalingChannel;
        this.dataChannel = null;
        this.chunk = null;
        this.iceCandidateQueue = [];

        this.canAcceptIce = false;

        this.pc = new RTCPeerConnection(cfgIceServers);

        this.pc.onicecandidate = (event) => {
            if (event.candidate) {
                this._signal(event.candidate);
            }
        };

        this.pc.oniceconnectionstatechange = () => {
            if (!this.pc)
                return;

            console.log(this.pc.iceConnectionState + ' WEBRTC ' + this.id);

            if (this.pc.iceConnectionState === 'failed') {
                this.failed();
            } else if (this.pc.iceConnectionState === 'disconnected') {
            }
        };
    }

    addIceCandidate(candidate) {
        if (!candidate)
            return;

        if (this.canAcceptIce)
            this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
                console.log(e);
            });
        else
            this.iceCandidateQueue.push(candidate);
    }

    startAcceptingIce() {
        this.canAcceptIce = true;
        for (let i in this.iceCandidateQueue) {
            let candidate = this.iceCandidateQueue[i];
            this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((e) => {
                console.log(e);
            });
        }

        this.iceCandidateQueue = [];
    }

    _signal(data) {
        this.signalingChannel.send(JSON.stringify(['data', this.id, data]));
    }

    _setupDataChannel() {
        this.dataChannel.onopen = () => {
        };

        this.dataChannel.onmessage = (event) => {
            let data = event.data;

            if (typeof (data) === 'string') {
                this.chunk.data += data;

                const percent = (this.chunk.data.length * 100) / this.chunk.size;
                this.notify('onprogress', { id: this.id, data: Math.floor(percent) });

                if (this.chunk.data.length === this.chunk.size) {
                    this.notify('onmessage', { id: this.id, data: this.chunk.data });
                }
            } else {
                const bytes = new Uint8Array(data);
                const size = byteArrayToNumber(bytes);
                this.chunk = { size: size, data: '' };
            }
        };

        this.dataChannel.onclose = () => {
        };
    }

    send(msg) {
        const nChunks = Math.floor(msg.length / CHUNK_SIZE);
        const remainder = msg.length - (nChunks * CHUNK_SIZE);

        let result = this._sendChunk(new Uint8Array(numberToByteArray(msg.length)));

        for (let i = 0; i < nChunks; i++) {
            const chunk = msg.substr(i * CHUNK_SIZE, CHUNK_SIZE);
            result = this._sendChunk(chunk);
            if (!result)
                break;
        }

        if (result && remainder > 0) {
            result = this._sendChunk(msg.substr(nChunks * CHUNK_SIZE, remainder));
        }

        return result;
    }

    _sendChunk(msg) {
        if (this.dataChannel) {
            if (this.dataChannel.readyState === 'open') {
                try {
                    this.dataChannel.send(msg);
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

    _disconnect(id) {
        if (this.dataChannel)
            this.dataChannel.close();
    }
}

class PeerConnectionSender extends PeerConnection {
    constructor(id, signalingChannel, cfgIceServers) {
        super(id, signalingChannel, cfgIceServers);


    }

    failed() {
        /*
            if (self.pcs[id].retry < 2) {
                this.createOffer();
            } else {
                console.log('failed %d times', self.pcs[id].retry);
                this._disconnect(id);
            }
        */
    }

    createOffer() {
        this.dataChannel = this.pc.createDataChannel(this.id);
        this._setupDataChannel();

        this.pc.createOffer().then((offer) => {
            return this.pc.setLocalDescription(offer);
        }).then(() => {
            this._signal(this.pc.localDescription);
        }).catch((e) => {
            console.log(e);
        });
    }

    receiveAnswer(sdp) {
        this.pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch((e) => {
            console.log(e);
        }).then(() => {
            this.startAcceptingIce();
        }).catch((e) => {
            console.log(e);
        });
    }
}

class PeerConnectionReceiver extends PeerConnection {
    constructor(id, signalingChannel, cfgIceServers) {
        super(id, signalingChannel, cfgIceServers);
    }

    failed() {
    }

    receiveOffer() {
        this.pc.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this._setupDataChannel();
        };
    }

    createAnswer(sdp) {
        let self = this;
        this.pc.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            return this.pc.createAnswer();
        }).then(answer => {
            return this.pc.setLocalDescription(answer);
        }).then(() => {
            this._signal(this.pc.localDescription);
            this.startAcceptingIce();
        }).catch((e) => {
            console.log(e);
        });
    }
}

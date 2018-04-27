class WebRtcDataChannel extends DataChannel {
    constructor(channel) {
        super();

        this._channel = channel;

        this._channel.onopen = () => this.notify('open');
        this._channel.onmessage = msg => this._onMessage(msg.data || msg);
        this._channel.onclose = () => this._onClose();
        this._channel.onerror = e => this.notify('error', e);
    }

    _onMessage(msg) {
        /*if (msg instanceof Blob) {
            const reader = new FileReader();
            reader.onloadend = () => super._onMessage(reader.result);
            reader.readAsArrayBuffer(msg);
        } else {
            super._onMessage(msg);
        }*/
        super._onMessage(msg);
    }

    _sendChunk(msg) {
        this._channel.send(msg);
    }

    close() {
        this._channel.close();
    }

    get readyState() {
        return DataChannel.ReadyState.fromString(this._channel.readyState);
    }
}

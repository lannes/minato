window.WebSocket = window.WebSocket || window.MozWebSocket;

class Minato {
}

Minato._currentScript = document.currentScript;
if (!Minato._currentScript) {
    const scripts = document.getElementsByTagName('script');
    Minato._currentScript = scripts[scripts.length - 1];
}

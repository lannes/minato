const atob = require('atob');
const btoa = require('btoa');

const WebSocket = require('ws');
const webrtc = require('wrtc');

const RTCPeerConnection = webrtc.RTCPeerConnection;
const RTCSessionDescription = webrtc.RTCSessionDescription;
const RTCIceCandidate = webrtc.RTCIceCandidate;

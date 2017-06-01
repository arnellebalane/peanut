const socket = window.io('/');
const peers = {};

const PeerConnection = window.RTCPeerConnection
    || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
const SessionDescription = window.RTCSessionDescription
    || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
const IceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate
    || window.mozRTCIceCandidate;

const getMediaStream = (() => {
    const constraints = {
        video: { aspectRatio: 16 / 9 },
        audio: true
    };
    let mediaStream = null;

    return async () => {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        return mediaStream;
    };
})();

const displayMediaStream = (mediaStream, key = null) => {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    const div = document.createElement('div');
    div.appendChild(video);
    if (key) {
        div.dataset.key = key;
    } else {
        video.volume = 0;
    }
    document.body.appendChild(div);
};

const setupPeerConnection = async (peerId) => {
    const configuration = {
        iceServers: [{
            url: 'stun:stun.l.google.com:19302'
        }, {
            url: 'turn:playground.arnellebalane.com:3478',
            username: 'arnelle-turn',
            credential: 'arnellepass-turn'
        }]
    };
    const connection = new PeerConnection(configuration);
    peers[peerId] = connection;

    const mediaStream = await getMediaStream();
    const noLocalMediaStream = document.querySelector('div:not([data-key])') === null;
    if (noLocalMediaStream) {
        displayMediaStream(mediaStream);
    }
    connection.addStream(mediaStream);
    connection.onaddstream = (e) => displayMediaStream(e.stream, peerId);

    connection.onicecandidate = (e) => {
        const payload = { peerId, data: JSON.stringify({ candidate: e.candidate }) };
        socket.emit('peericecandidate', payload);
    };

    return connection;
};

socket.on('peerconnect', async (peerId) => {
    const connection = await setupPeerConnection(peerId);
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    const payload = { peerId, data: JSON.stringify({ sdp: offer }) };
    socket.emit('peeroffer', payload);
});

socket.on('peeroffer', async ({ peerId, data }) => {
    const connection = await setupPeerConnection(peerId);
    const offer = new SessionDescription(JSON.parse(data).sdp);
    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer(offer);
    await connection.setLocalDescription(answer);

    const payload = { peerId, data: JSON.stringify({ sdp: answer }) };
    socket.emit('peeranswer', payload);
});

socket.on('peeranswer', async ({ peerId, data }) => {
    const answer = new SessionDescription(JSON.parse(data).sdp);
    peers[peerId].setRemoteDescription(answer);
});

socket.on('peericecandidate', async ({ peerId, data }) => {
    const candidateData = JSON.parse(data).candidate;
    const peer = peers[peerId];
    if (candidateData && peer && peer.remoteDescription.type) {
        const candidate = new IceCandidate(candidateData);
        peers[peerId].addIceCandidate(candidate);
    }
});

socket.on('peerdisconnect', (peerId) => {
    delete peers[peerId];
    document.querySelector(`div[data-key="${peerId}"]`).remove();
});

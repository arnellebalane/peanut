const socket = window.io('/');
const peers = {};

const PeerConnection = window.RTCPeerConnection
    || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
const SessionDescription = window.RTCSessionDescription
    || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
const IceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate
    || window.mozRTCIceCandidate;

const $ = (selector, context = document) => context.querySelector(selector);

const getMediaStream = (() => {
    const constraints = { video: true, audio: true };
    let mediaStream = null;

    return async () => {
        if (!mediaStream) {
            mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        }
        return mediaStream;
    };
})();

const createMediaStreamDislay = (mediaStream, muted) => {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    video.volume = muted ? 0 : 1;
    const div = document.createElement('div');
    div.appendChild(video);
    return div;
};

const displayMediaStream = (mediaStream, key = null) => {
    const display = createMediaStreamDislay(mediaStream, key === null);
    display.classList.add('minimized-stream');
    if (key) {
        display.dataset.key = key;
    } else {
        display.classList.add('maximized');
    }
    $('.minimized-streams-container').appendChild(display);
};

const displayMaximizedMediaStream = (mediaStream) => {
    const display = createMediaStreamDislay(mediaStream, true);
    display.classList.add('maximized-stream');
    document.body.appendChild(display);
};

const maximizeMediaStream = (mediaStream) => {
    $('.maximized-stream video').srcObject = mediaStream;
};

const highlightMediaStreamContainer = (container) => {
    $('.maximized', container.parentNode).classList.remove('maximized');
    container.classList.add('maximized');
};

const setupPeerConnection = async (peerId) => {
    const iceServers = [{
        url: 'stun:stun.l.google.com:19302'
    }];

    try {
        const credentialsEndpoint = 'https://turncm.arnellebalane.com/credentials?username=arnellebalane';
        const credential = await fetch(credentialsEndpoint).then((response) => response.json());
        credential.uris.forEach((uri) => iceServers.push({
            url: uri,
            username: credential.username,
            credential: credential.password
        }));
    } catch (e) {
        console.error(e);
    }

    const connection = new PeerConnection({ iceServers });
    peers[peerId] = connection;

    const mediaStream = await getMediaStream();
    const localMediaStreamSelector = '.minimized-stream:not([data-key])';
    const noLocalMediaStream = $(localMediaStreamSelector) === null;
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


getMediaStream().then(displayMaximizedMediaStream);

$('.minimized-streams-container').addEventListener('click', (e) => {
    const mediaStreamContainer = e.target.closest('.minimized-stream');
    if (mediaStreamContainer) {
        const mediaStream = $('video', mediaStreamContainer).srcObject;
        maximizeMediaStream(mediaStream);
        highlightMediaStreamContainer(mediaStreamContainer);
    }
});


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
    $(`div[data-key="${peerId}"]`).remove();
    if (Object.keys(peers).length === 0) {
        $('.minimized-stream').remove();
        getMediaStream().then(maximizeMediaStream);
    }
});

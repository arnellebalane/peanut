const socket = io('/');

(async () => {
    const peers = {};
    const mediaStream = displayMediaStream(await getMediaStream());

    socket.on('peerconnect', async (peerId) => {
        const connection = new RTCPeerConnection();
        const offerDescription = await connection.createOffer();
        connection.setLocalDescription(offerDescription);
        peers[peerId] = connection;
        socket.emit('peeroffer', {
            peerId: peerId,
            data: JSON.stringify({ sdp: offerDescription })
        });
    });

    socket.on('peeroffer', async ({ peerId, data }) => {
        data = JSON.parse(data);
        const connection = new RTCPeerConnection();
        connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answerDescription = await connection.createAnswer(connection.remoteDescription);
        connection.setLocalDescription(answerDescription);
        peers[peerId] = connection;
        socket.emit('peeranswer', {
            peerId: peerId,
            data: JSON.stringify({ sdp: answerDescription })
        });
        console.log('peeroffer');
        console.log(connection);
    });

    socket.on('peeranswer', async ({ peerId, data }) => {
        data = JSON.parse(data);
        peers[peerId].setRemoteDescription(new RTCSessionDescription(data.sdp));
        console.log('peeranswer');
        console.log(peers[peerId]);
    });
})();

async function getMediaStream() {
    const constraints = { video: true };
    return await navigator.mediaDevices.getUserMedia(constraints);
}

function displayMediaStream(mediaStream) {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    document.body.appendChild(video);
}

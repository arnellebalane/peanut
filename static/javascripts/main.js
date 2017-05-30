const socket = io('/');

(async () => {
    const peers = {};

    socket.on('peerconnect', async (peerId) => {
        const connection = new RTCPeerConnection();

        const mediaStream = await getMediaStream();
        if (!document.querySelector('video:not([data-key])')) {
            displayMediaStream(mediaStream);
        }
        connection.addStream(mediaStream);
        connection.onaddstream = (e) => displayMediaStream(e.stream, peerId);

        connection.onicecandidate = (e) => {
            socket.emit('peericecandidate', {
                peerId: peerId,
                data: JSON.stringify({ candidate: e.candidate })
            });
        };

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

        const mediaStream = await getMediaStream();
        if (!document.querySelector('video:not([data-key])')) {
            displayMediaStream(mediaStream);
        }
        connection.addStream(mediaStream);
        connection.onaddstream = (e) => displayMediaStream(e.stream, peerId);

        connection.onicecandidate = (e) => {
            socket.emit('peericecandidate', {
                peerId: peerId,
                data: JSON.stringify({ candidate: e.candidate })
            });
        };

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

    socket.on('peericecandidate', async ({ peerId, data }) => {
        data = JSON.parse(data);
        try {
            peers[peerId].addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
            console.log(data);
            console.error(e);
        }
    });

    socket.on('peerdisconnect', (peerId) => {
        delete peers[peerId];
        document.querySelector(`video[data-key="${peerId}"]`).remove();
    });
})();

async function getMediaStream() {
    const constraints = { video: true };
    return await navigator.mediaDevices.getUserMedia(constraints);
}

function displayMediaStream(mediaStream, key) {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    if (key) {
        video.dataset.key = key;
    }
    document.body.appendChild(video);
}

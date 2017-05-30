setup();

async function setup() {
    const constraints = { video: true };
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    displayMediaStream(mediaStream);
}

function displayMediaStream(mediaStream) {
    const video = document.createElement('video');
    video.srcObject = mediaStream;
    video.autoplay = true;
    document.body.appendChild(video);
}

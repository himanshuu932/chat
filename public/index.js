
const socket = io();
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const callButton = document.getElementById('call-button');
const hangupButton = document.getElementById('hangup-button');
const muteAudioButton = document.getElementById('mute-audio-button');
const stopVideoButton = document.getElementById('stop-video-button');
const modal = document.getElementById('modal');
const okButton = document.getElementById('ok-button');
const noButton = document.getElementById('no-button');
const localMutedLabel = document.getElementById('local-muted-label');

const roomId = '12'; // Predefined room ID
const popupMenu = document.getElementById('popup-menu');
let isDragging = false;
let offsetX, offsetY;

popupMenu.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popupMenu.getBoundingClientRect().left;
    offsetY = e.clientY - popupMenu.getBoundingClientRect().top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(e) {
    if (isDragging) {
        popupMenu.style.left = `${e.clientX - offsetX}px`;
        popupMenu.style.top = `${e.clientY - offsetY}px`;
    }
}

function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}
let localStream;
let peerConnection;
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};
let isMuted = false;
let isVideoStopped = false;
let callPending = false;

// Join room automatically with the predefined room ID
socket.emit('joinCall', roomId);
let called = false;

async function startCall() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('candidate', roomId, event.candidate);
        }
    };

    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', roomId, offer);
}

callButton.addEventListener('click', async () => {
    document.getElementById('popup-menu').style.display='flex';
    try {
        if (!called) {
            await startCall();
            called = true;
            updateButtonStates(true);
        }
    } catch (error) {
        console.error('Error starting call:', error);
        alert('Error starting call. Please check your camera and microphone.');
    }
});

hangupButton.addEventListener('click', () => {
    
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
        remoteVideo.srcObject = null;
        socket.emit('hangup', roomId);
    }
    location.reload(); // Reload the page
});

muteAudioButton.addEventListener('click', () => {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            isMuted = !isMuted;
            socket.emit('mute', roomId, isMuted);
            muteAudioButton.textContent = isMuted ? 'Unmute Audio' : 'Mute Audio';
        }
    }
});

stopVideoButton.addEventListener('click', () => {
    if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        if (videoTracks.length > 0) {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            isVideoStopped = !isVideoStopped;
            socket.emit('video',roomId,isVideoStopped);
            stopVideoButton.textContent = isVideoStopped ? 'Start Video' : 'Stop Video';
        }
    }
});

function updateButtonStates(callInProgress) {
    if (callInProgress) {
        callButton.style.display = 'none';
        hangupButton.style.display = 'inline-block';
        muteAudioButton.style.display = 'inline-block';
        stopVideoButton.style.display = 'inline-block';
    } else {
        callButton.style.display = 'inline-block';
        hangupButton.style.display = 'none';
        muteAudioButton.style.display = 'none';
        stopVideoButton.style.display = 'none';
    }
}

socket.on('offer', async (offer) => {
   
    if (!peerConnection) {
        peerConnection = new RTCPeerConnection(configuration);

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidate', roomId, event.candidate);
            }
        };

        peerConnection.ontrack = (event) => {
            remoteVideo.srcObject = event.streams[0];
        };
    }

    if (called) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', roomId, answer);
            modal.style.display = 'none'; // Hide the modal
            callPending = false;
        } catch (error) {
            console.error('Error handling offer:', error);
          
        }
    } else {
        modal.style.display = 'flex';
        callPending = true;

        okButton.addEventListener('click', async () => {
            document.getElementById('popup-menu').style.display='flex';
            if (callPending) {
                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    socket.emit('answer', roomId, answer);
                   
                    modal.style.display = 'none'; // Hide the modal
                    callPending = false;
                    if (!called) {
                        await startCall();
                        called = true;
                        updateButtonStates(true);
                    }
                } catch (error) {
                    console.error('Error handling offer:', error);
                   
                }
            }
        });

        noButton.addEventListener('click', () => {
            if (callPending) {
                socket.emit('hangup', roomId);
                modal.style.display = 'none'; // Hide the modal
                callPending = false;
            }
        });
    }
});

socket.on('answer', async (answer) => {
    startCallDuration();
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
        console.error('Error handling answer:', error);
    }
});

socket.on('candidate', async (candidate) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
        console.error('Error adding ice candidate:', error);
    }
});
async function changelabel()
{
    if(mute && off)
   { document.getElementById('local-muted-label').style.display= document.getElementById('local-muted-label').style.display==='none'?'flex':'none';
    document.getElementById('remote-muted-label').textContent = 'video audio off';
    document.getElementById('remote-muted-label').style.display= document.getElementById('remote-muted-label').style.display==='none'?'flex':'none';
    document.getElementById('local-muted-label').textContent = 'Video audio off';
}
    else if(mute)
   { document.getElementById('local-muted-label').style.display= document.getElementById('local-muted-label').style.display==='none'?'flex':'none';
   document.getElementById('local-muted-label').textContent = 'muted';
   document.getElementById('remote-muted-label').style.display= document.getElementById('remote-muted-label').style.display==='none'?'flex':'none';
   document.getElementById('remote-muted-label').textContent = 'muted';
}
else if(off)
   { document.getElementById('local-muted-label').style.display= document.getElementById('local-muted-label').style.display==='none'?'flex':'none';
   document.getElementById('local-muted-label').textContent = 'Video off';
    document.getElementById('remote-muted-label').style.display= document.getElementById('remote-muted-label').style.display==='none'?'flex':'none';
    document.getElementById('remote-muted-label').textContent = 'video off';
}
else{}

} 
localVideo.addEventListener('click', () => {
    if(!activescreen1)
    return 
    activescreen1=!activescreen1;
   changelabel();
   swapStyles();
 
});
remoteVideo.addEventListener('click', () => {
    if(activescreen1)
    return 
    activescreen1=!activescreen1;
   changelabel();
   swapStyles();
 
});

let mute=false;
let off=false;
let activescreen1=true;

socket.on('mute', async (isMuted) => {
if (activescreen1) {

    if(off){
    const remoteLabel = document.getElementById('remote-muted-label');
    remoteLabel.textContent = isMuted  ? 'Audio Video off' : 'video off'; 
    }
    else{
        const remoteLabel = document.getElementById('remote-muted-label');
    remoteLabel.style.display = isMuted ? 'block' : 'none';
    remoteLabel.textContent = isMuted ? 'Muted ' : ''; 
    }
    
    // Set text content based on mute status
} else {
    if(off){
    const remoteLabel = document.getElementById('local-muted-label');
    remoteLabel.textContent = isMuted  ? 'Audio Video off' : 'video off'; 
    }
    else{
        const remoteLabel = document.getElementById('local-muted-label');
    remoteLabel.style.display = isMuted ? 'block' : 'none';
    remoteLabel.textContent = isMuted ? 'Muted ' : ''; 
    }// Set text content based on mute status
}

// Toggle 'mute' state
mute = !mute;
});


socket.on('video', async (isVideoStopped) => {
    if (activescreen1) {

if(mute){
const remoteLabel = document.getElementById('remote-muted-label');
remoteLabel.textContent = isVideoStopped ? 'Audio Video off' : 'muted'; 
}
else{
const remoteLabel = document.getElementById('remote-muted-label');
remoteLabel.style.display = isVideoStopped ? 'block' : 'none';
remoteLabel.textContent = isVideoStopped ? 'video off ' : ''; 
}

// Set text content based on mute status
} else {
if(mute){
const remoteLabel = document.getElementById('local-muted-label');
remoteLabel.textContent = isVideoStopped  ? 'Audio Video off' : 'muted'; 
}
else{
const remoteLabel = document.getElementById('local-muted-label');
remoteLabel.style.display = isVideoStopped ? 'block' : 'none';
remoteLabel.textContent = isVideoStopped ? 'video off ' : ''; 
}// Set text content based on mute status
}
// Toggle 'off' state
off = !off;
});

// Handle hangup event from server
socket.on('hangup', () => {
  
    stopCallDuration();
    location.reload(); 
});
function setcss1(){
  // Set CSS properties for remote video
remoteVideo.style.width = '100%';
remoteVideo.style.height = '90%';
remoteVideo.style.top = '0';
remoteVideo.style.border = '2px solid #fff';
remoteVideo.style.borderRadius = '15px'; // Rounded corners
remoteVideo.style.objectFit = 'cover'; // Ensure the video covers the container

// Set CSS properties for local video
localVideo.style.position = 'absolute';
localVideo.style.bottom = '10%'; // Position from the bottom
localVideo.style.right = '10px'; // Position from the right
localVideo.style.maxWidth = '30%'; // Maximum width as a percentage of the container
localVideo.style.maxHeight = '30%'; // Maximum height as a percentage of the container
localVideo.style.border = '2px solid #fff';
localVideo.style.borderRadius = '15px'; // Rounded corners
localVideo.style.zIndex = '10'; // Ensure local video is on top
localVideo.style.cursor = 'pointer'; // Show that this element is clickable
localVideo.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.5)'; // Shadow for local video
localVideo.style.objectFit = 'contain'; // Maintain aspect ratio
}

function swapStyles() {
// Get current styles
const remoteStyles = {
    width: remoteVideo.style.width,
    height: remoteVideo.style.height,
    top: remoteVideo.style.top,
    border: remoteVideo.style.border,
    borderRadius: remoteVideo.style.borderRadius,
    objectFit: remoteVideo.style.objectFit,
    position: remoteVideo.style.position,
    bottom: remoteVideo.style.bottom,
    right: remoteVideo.style.right,
    maxWidth: remoteVideo.style.maxWidth,
    maxHeight: remoteVideo.style.maxHeight,
    zIndex: remoteVideo.style.zIndex,
    cursor: remoteVideo.style.cursor,
    boxShadow: remoteVideo.style.boxShadow
};

const localStyles = {
    width: localVideo.style.width,
    height: localVideo.style.height,
    top: localVideo.style.top,
    border: localVideo.style.border,
    borderRadius: localVideo.style.borderRadius,
    objectFit: localVideo.style.objectFit,
    position: localVideo.style.position,
    bottom: localVideo.style.bottom,
    right: localVideo.style.right,
    maxWidth: localVideo.style.maxWidth,
    maxHeight: localVideo.style.maxHeight,
    zIndex: localVideo.style.zIndex,
    cursor: localVideo.style.cursor,
    boxShadow: localVideo.style.boxShadow
};

// Apply remote styles to localVideo
localVideo.style.width = remoteStyles.width;
localVideo.style.height = remoteStyles.height;
localVideo.style.top = remoteStyles.top;
localVideo.style.border = remoteStyles.border;
localVideo.style.borderRadius = remoteStyles.borderRadius;
localVideo.style.objectFit = remoteStyles.objectFit;
localVideo.style.position = remoteStyles.position;
localVideo.style.bottom = remoteStyles.bottom;
localVideo.style.right = remoteStyles.right;
localVideo.style.maxWidth = remoteStyles.maxWidth;
localVideo.style.maxHeight = remoteStyles.maxHeight;
localVideo.style.zIndex = remoteStyles.zIndex;
localVideo.style.cursor = remoteStyles.cursor;
localVideo.style.boxShadow = remoteStyles.boxShadow;

// Apply local styles to remoteVideo
remoteVideo.style.width = localStyles.width;
remoteVideo.style.height = localStyles.height;
remoteVideo.style.top = localStyles.top;
remoteVideo.style.border = localStyles.border;
remoteVideo.style.borderRadius = localStyles.borderRadius;
remoteVideo.style.objectFit = localStyles.objectFit;
remoteVideo.style.position = localStyles.position;
remoteVideo.style.bottom = localStyles.bottom;
remoteVideo.style.right = localStyles.right;
remoteVideo.style.maxWidth = localStyles.maxWidth;
remoteVideo.style.maxHeight = localStyles.maxHeight;
remoteVideo.style.zIndex = localStyles.zIndex;
remoteVideo.style.cursor = localStyles.cursor;
remoteVideo.style.boxShadow = localStyles.boxShadow;
}

window.addEventListener('DOMContentLoaded', () => {
setcss1();


});

let callStartTime;
let callDurationInterval;

function updateCallDuration() {
    const now = new Date();
    const duration = new Date(now - callStartTime);

    const minutes = String(duration.getUTCMinutes()).padStart(2, '0');
    const seconds = String(duration.getUTCSeconds()).padStart(2, '0');

    document.getElementById('call-duration').textContent = `${minutes}:${seconds}`;
}

function startCallDuration() {
    callStartTime = new Date();
    callDurationInterval = setInterval(updateCallDuration, 1000);
}

function stopCallDuration() {
    clearInterval(callDurationInterval);
}



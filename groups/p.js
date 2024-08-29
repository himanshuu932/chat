
document.addEventListener('DOMContentLoaded', async () => {
    const socket = io();
    let userName = '';
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('chatId');
   let uid="";
  const cuid=localStorage.getItem('userId');
    var selectedMembers = [];

  function getUserName() {
        while (!userName.trim()) {
            userName = localStorage.getItem('name');
            if (userName.trim()) {
                localStorage.setItem('name', userName);
            }
        }
    }

    getUserName(); // Prompt for the user's name

    if (!groupId) {
        alert('Group ID not found!');
        window.location.href = "/groups.html";
        return;
    }

    async function fetchGroupName(groupId) {
try {
const response = await fetch(`/get-users/${groupId}`);
if (response.ok) {
    const data = await response.json();
    
    const users = data.users;
    const members=data.members;
    const groupName = users.find(user => user !== userName) || 'Unknown Group'; 
     uid=members.find(user => user !== cuid)// Adjust according to your logic
    return groupName;
} else {
    console.error('Error fetching users:', response.statusText);
    return null;
}
} catch (error) {
console.error('Fetch error:', error);
return null;
}
}

    const groupName =await fetchGroupName(groupId);
    if (!groupName) {
        alert('Group not found');
        return;
    }

    document.getElementById('name').textContent = groupName;

  
    socket.emit('join group', groupId, userName);

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const infoToggle = document.getElementById('info-toggle');
  
    const notificationSound = new Audio('/groups/notification.wav');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (input.value) {
            const now = new Date();
            const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const message = { userName, text: input.value, timestamp: formattedTime };

           

            // Save message to the server
            try {
const response = await fetch(`/add-message/${groupId}`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ timestamp: formattedTime, userName, text: input.value, excluded:selectedMembers })
});
const data = await response.json();
if (response.ok) {

    socket.emit('chat message', { groupId, message, selectedMembers });
                    input.value = '';
                    notificationSound.play();
                  
} else {
    console.error('Error adding message:', data.message);
}
} catch (error) {
console.error('Fetch error:', error);
}
                    
                    // Clear the selected members after sending the message
                   
               
        }
    });


    //display
    async function fetchAndDisplayMessages(groupId) {
        try {
            const response = await fetch(`/pmessages/${groupId}`);
            if (response.ok) {
                const messages = await response.json();
                const messagesContainer = document.getElementById('messages');
                messagesContainer.innerHTML = '';

                const currentUserId = localStorage.getItem('userId'); // Retrieve the current user ID from localStorage

                messages.forEach((message) => {
                    let timestamp = message.timestamp;
                    let excluded = message.excluded;
                    let user = message.userName;
                    let text = message.text;

                    if (!excluded || !excluded.includes(currentUserId)) { // Check if current user is excluded
                        const item = document.createElement('li');
                        item.className = userName === user ? 'message-sent' : 'message-received'; // Adjust based on current user

                        const header = document.createElement('div');
                        header.className = 'message-header';
                        header.textContent = user;

                        const content = document.createElement('div');
                        content.className = 'message-content';
                        content.textContent = text;

                        const timestampElement = document.createElement('div');
                        timestampElement.className = 'message-timestamp';
                        timestampElement.textContent = timestamp;

                        item.appendChild(header);
                        item.appendChild(content);
                        item.appendChild(timestampElement);

                        messagesContainer.appendChild(item);
                    }
                });

                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            } else {
                console.error('Error fetching chat messages:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching chat messages:', error);
        }
    }

    fetchAndDisplayMessages(groupId);


  socket.on('chat message', async (data) => {
      
    const { message } = data;
        // Debugging: Log received data
      
            const item = document.createElement('li');
            item.className = message.userName === userName ? 'message-sent' : 'message-received';

            const header = document.createElement('div');
            header.className = 'message-header';
            header.textContent = message.userName;

            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = message.text;

            const timestamp = document.createElement('div');
            timestamp.className = 'message-timestamp';
            timestamp.textContent = message.timestamp;

            item.appendChild(header);
            item.appendChild(content);
            item.appendChild(timestamp);

            messages.appendChild(item);

            messages.scrollTop = messages.scrollHeight;

            notificationSound.play();
       
    });

    infoToggle.addEventListener('click', () => {
        window.location.href = `pinfo.html?userId=${uid}&username=${encodeURIComponent(userName)}`;
    });
   
  function enablevideocall()
  {
     
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

const roomId = groupId; // Predefined room ID
const popupMenu1 = document.getElementById('popup-menu2');
let isDragging = false;
let offsetX, offsetY;

popupMenu1.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - popupMenu1.getBoundingClientRect().left;
    offsetY = e.clientY - popupMenu1.getBoundingClientRect().top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(e) {
    if (isDragging) {
        popupMenu1.style.left = `${e.clientX - offsetX}px`;
        popupMenu1.style.top = `${e.clientY - offsetY}px`;
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
    notificationSound.play();
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
    document.getElementById('popup-menu2').style.display='flex';
    setcss1();
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
            muteAudioButton.innerHTML = isMuted ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3"/>
  <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z"/>
</svg>
            ` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
  <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
</svg>`;
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
            stopVideoButton.innerHTML = isVideoStopped ? `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-off-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M10.961 12.365a2 2 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272zm-10.114-9A2 2 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728zm9.746 11.925-10-14 .814-.58 10 14z"/>
</svg>
            
            `: `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-video-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2z"/>
</svg>
            `;
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
            document.getElementById('popup-menu2').style.display='flex';
            setcss1();
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


  }
  enablevideocall();
    enableaudiocall();
   function enableaudiocall() {  
    // const localVideo = document.getElementById('ac-local-video');
    const acRemoteVideo = document.getElementById('ac-remote-video');
    const audiocallButton = document.getElementById('audio-call-button');
    const audiohangupButton = document.getElementById('audio-hangup-button');
    const muteAudioButton1 = document.getElementById('mute-audio-button1');
    const stopVideoButton = document.getElementById('stop-video-button');
    const acmodal = document.getElementById('acmodal');
    const acokButton = document.getElementById('ac-ok-button');
    const acnoButton = document.getElementById('ac-no-button');
  
    
    const roomId = groupId; // Predefined room ID
    const audioPopupMenu = document.getElementById('popupmenu1');
    let isDragging = false;
    let offsetX, offsetY;
    
    audioPopupMenu.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - audioPopupMenu.getBoundingClientRect().left;
        offsetY = e.clientY - audioPopupMenu.getBoundingClientRect().top;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
    
    function onMouseMove(e) {
        if (isDragging) {
            audioPopupMenu.style.left = `${e.clientX - offsetX}px`;
            audioPopupMenu.style.top = `${e.clientY - offsetY}px`;
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
    socket.emit('joinAudioCall', roomId);
    let called = false;
    
    async function startCall() {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection = new RTCPeerConnection(configuration);
    
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('candidateAudio', roomId, event.candidate);
            }
        };
    
        peerConnection.ontrack = (event) => {
            acRemoteVideo.srcObject = event.streams[0];
        };
    
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    
        const offerAudio = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerAudio);
        socket.emit('offerAudio', roomId, offerAudio);
    }
    
    audiocallButton.addEventListener('click', async () => {
        document.getElementById('popupmenu1').style.display='flex';
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
    
    audiohangupButton.addEventListener('click', () => {
        
       
            socket.emit('hangupAudio', roomId);
        
        location.reload(); // Reload the page
    });
    
    muteAudioButton1.addEventListener('click', () => {
        if (localStream) {
            const audioTracks = localStream.getAudioTracks();
            if (audioTracks.length > 0) {
                audioTracks[0].enabled = !audioTracks[0].enabled;
                isMuted = !isMuted;
                socket.emit('muteAudio', roomId, isMuted);
                muteAudioButton1.innerHTML = isMuted ? `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
      <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4 4 0 0 0 12 8V7a.5.5 0 0 1 1 0zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a5 5 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4m3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3"/>
      <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607m-7.84-9.253 12 12 .708-.708-12-12z"/>
    </svg>
                ` : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
      <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
      <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
    </svg>`;
            }
        }
    });
    
       
    function updateButtonStates(callInProgress) {
        if (callInProgress) {
            audiocallButton.style.display = 'none';
            audiohangupButton.style.display = 'inline-block';
            muteAudioButton1.style.display = 'inline-block';
          //  stopVideoButton.style.display = 'inline-block';
        } else {
            audiocallButton.style.display = 'inline-block';
            audiohangupButton.style.display = 'none';
            muteAudioButton1.style.display = 'none';
            //stopVideoButton.style.display = 'none';
        }
    }
    
    socket.on('offerAudio', async (offerAudio) => {
       
        if (!peerConnection) {
            peerConnection = new RTCPeerConnection(configuration);
    
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('candidateAudio', roomId, event.candidate);
                }
            };
    
            peerConnection.ontrack = (event) => {
                acRemoteVideo.srcObject = event.streams[0];
            };
        }
    
        if (called) {
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offerAudio));
                const answerAudio = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answerAudio);
                socket.emit('answerAudio', roomId, answerAudio);
                acmodal.style.display = 'none'; // Hide the acmodal
                callPending = false;
            } catch (error) {
                console.error('Error handling offerAudio:', error);
              
            }
        } else {
            acmodal.style.display = 'flex';
            callPending = true;
    
            acokButton.addEventListener('click', async () => {
                document.getElementById('popupmenu1').style.display='flex';
                if (callPending) {
                    try {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerAudio));
                        const answerAudio = await peerConnection.createAnswer();
                        await peerConnection.setLocalDescription(answerAudio);
                        socket.emit('answerAudio', roomId, answerAudio);
                       
                        acmodal.style.display = 'none'; // Hide the acmodal
                        callPending = false;
                        if (!called) {
                            await startCall();
                            called = true;
                            updateButtonStates(true);
                        }
                    } catch (error) {
                        console.error('Error handling offerAudio:', error);
                       
                    }
                }
            });
    
            acnoButton.addEventListener('click', () => {
                if (callPending) {
                    socket.emit('hangupAudio', roomId);
                    acmodal.style.display = 'none'; // Hide the acmodal
                    callPending = false;
                }
            });
        }
    });
    
    socket.on('answerAudio', async (answerAudio) => {
        startCallDuration();
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answerAudio));
        } catch (error) {
            console.error('Error handling answerAudio:', error);
        }
    });
    
    socket.on('candidateAudio', async (candidate) => {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ice candidate:', error);
        }
    });
    
    let mute=false;
    let off=false;
 //   let activescreen1=true;
    
   
    
   
    // Handle hangupAudio event from server
    socket.on('hangupAudio', () => {
      
        stopCallDuration();
        location.reload(); 
    });
    
    
    let callStartTime;
    let callDurationInterval;
    
    function updateCallDuration() {
        const now = new Date();
        const duration = new Date(now - callStartTime);
    
        const minutes = String(duration.getUTCMinutes()).padStart(2, '0');
        const seconds = String(duration.getUTCSeconds()).padStart(2, '0');
    
        document.getElementById('ac-call-duration').textContent = `${minutes}:${seconds}`;
    }
    
    function startCallDuration() {
        callStartTime = new Date();
        callDurationInterval = setInterval(updateCallDuration, 1000);
    }
    
    function stopCallDuration() {
        clearInterval(callDurationInterval);
    }
    }

    socket.emit('new user', userName);
});


document.addEventListener('DOMContentLoaded', async (event) => {
    const socket = io();
    let userName = '';

    // Function to prompt for a name until a valid one is provided
    function getUserName() {
        while (!userName.trim()) {
            userName = localStorage.getItem('name');
            if (userName.trim()) {
                localStorage.setItem('name', userName);
            }
        }
    }

    getUserName(); // Prompt for the user's name

    // Get group ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');

    if (!groupId) {
        alert('Group ID not found!');
        window.location.href = "/groups.html";
        return;
    }

    // Fetch the group name from the server
    async function fetchGroupName(groupId) {
        const response = await fetch(`/group/${groupId}`);
        if (response.ok) {
            const data = await response.json();
            return data.name;
        } else {
            alert('Error fetching group name');
        }
    }

    const groupName = await fetchGroupName(groupId);
    if (!groupName) {
        alert('Group not found');
        return;
    }

    // Update the header with the group name and the "+" button
    document.getElementById('header').innerHTML = `
        <div>
            <h1>${groupName}</h1>
        </div>
        <button id="info-toggle">ℹ️</button>
    `;

    // Join the group room
    socket.emit('join group', groupId, userName);

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const infoToggle = document.getElementById('info-toggle');

    // Create an audio element for notification sound
    const notificationSound = new Audio('notification.wav');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            const now = new Date();
            const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const message = { userName, text: input.value, timestamp: formattedTime };
            socket.emit('chat message', { groupId, message });
            input.value = '';
            notificationSound.play(); // Play sound on message sent
        }
    });

    socket.on('chat message', (data) => {
        const { message } = data;
        const item = document.createElement('li');
        item.className = message.userName === userName ? 'message-sent' : 'message-received';

        const header = document.createElement('div');
        header.className = 'message-header';
        header.textContent = message.userName;

        const content = document.createElement('div');
        content.textContent = message.text;

        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = message.timestamp;

        item.appendChild(header);
        item.appendChild(content);
        item.appendChild(timestamp);

        messages.appendChild(item);
        window.scrollTo(0, document.body.scrollHeight);
        notificationSound.play(); // Play sound on message received
    });

    // Toggle chat box and info container
    infoToggle.addEventListener('click', () => {
        window.location.href = `info.html?groupId=${groupId}`;
    });

    // Notify
    socket.emit('new user', userName);
});


document.addEventListener('DOMContentLoaded', async () => {
    const socket = io();
    let userName = '';
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');
    var selectedMembers = []; // Array to store selected members

    document.getElementById('fetchMembers').addEventListener('click', async (e) => {
        // Extract names of selected members and join them into a string
       

        console.log("Fetch Members button clicked");
        await mem();
        const popupMenu = document.getElementById('popup-menu');
        popupMenu.style.display = popupMenu.style.display === 'block' ? 'none' : 'block';
    });

    async function mem() {
        const response = await fetch(`/group/${groupId}`);
        if (response.ok) {
            const data = await response.json();
            const { name, members } = data;
            //alert(members)
            const memberDetails = await Promise.all(members.map(async (userId) => {
                const result = await fetch(`/getusername/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const resultData = await result.json();
                return {
                    id: userId,
                    name: resultData.username
                };
            }));

            memberDetails.sort((a, b) => a.name.localeCompare(b.name));

            const popupMenu = document.getElementById('popup-menu');
            popupMenu.innerHTML = ''; // Clear previous content

            const ul = document.createElement('ul');

            memberDetails.forEach(({ id, name }) => {
                const li = document.createElement('li');

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.userId = id;

                const label = document.createElement('label');
                label.textContent = name;
                label.prepend(checkbox);

                li.appendChild(label);
                ul.appendChild(li);
            });

            popupMenu.appendChild(ul);

            // Add event listener to handle popup close
            document.addEventListener('click', (event) => {
                if (event.target !== document.getElementById('fetchMembers') && event.target.closest('#popup-menu') === null) {
                    if( document.getElementById('popup-menu').style.display != 'none')
                    updateSelectedMembers();
                    document.getElementById('popup-menu').style.display = 'none';
                }
            });
        }
    }

    function updateSelectedMembers() {
        selectedMembers = Array.from(document.querySelectorAll('#popup-menu input[type="checkbox"]:checked'))
            .map(cb => ({
                id: cb.dataset.userId,
                name: cb.nextSibling.textContent
            }));
        console.log('Selected members:', selectedMembers);
    }

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

    document.getElementById('header').innerHTML = `
        <div>
            <h1>${groupName}</h1>
        </div>
        <button id="info-toggle">ℹ️</button>
    `;

    async function fetchAndDisplayMessages(groupId) {
        try {
            const response = await fetch(`/messages/${groupId}`);
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

    socket.emit('join group', groupId, userName);

    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const messages = document.getElementById('messages');
    const infoToggle = document.getElementById('info-toggle');

    const notificationSound = new Audio('./notification.wav');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (input.value) {
            const now = new Date();
            const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const message = { userName, text: input.value, timestamp: formattedTime };

           

            // Save message to the server
            try {
                const response = await fetch('/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupId, userName, text: input.value, excluded: selectedMembers.map(member => member.id), timestamp: formattedTime }) // Ensure excluded is an array of IDs
                });
                if (response.ok) {
                    socket.emit('chat message', { groupId, message, selectedMembers });
                    input.value = '';
                    notificationSound.play();
                  
                    // Clear the selected members after sending the message
                    selectedMembers.length = 0;

                    selectedMembers = [];
                    console.log('Selected members cleared after sending message.');
                } else {
                    console.error('Error saving message:', response.statusText);
                }
            } catch (error) {
                console.error('Error saving message:', error);
            }
        }
    });

    async function check(excluded, message) {
        // Extract names from excluded array
        const excludedNames = excluded.map(member => member.name);

        // Debugging: Log each excluded name individually
        console.log('Excluded names:');
        excludedNames.forEach(name => console.log(name));

        // Log the message sender's name
        console.log(`Message sender: ${message.userName}`);

        // Log whether the sender's name is excluded
        const isExcluded = excludedNames.includes(userName);
        console.log(`Is the message sender excluded? ${isExcluded}`);

        // Check if message sender's name is in the excluded list
        return !isExcluded;
    }

    socket.on('chat message', async (data) => {
        const { message, excluded } = data;

        // Debugging: Log received data
        console.log('Received data:', data);

        const shouldDisplay = await check(excluded, message);
        console.log('Should display:', shouldDisplay);

        if (shouldDisplay) {
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
        } else {
            console.log("Message was excluded");
        }
    });

    infoToggle.addEventListener('click', () => {
        window.location.href = `info.html?groupId=${groupId}&username=${encodeURIComponent(userName)}`;
    });

    socket.emit('new user', userName);
});

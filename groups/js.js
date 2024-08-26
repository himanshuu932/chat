
  
function showContainer(containerId) {
    // Hide all containers
    const containers = document.querySelectorAll('.container');
    containers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Show the selected container
    const activeContainer = document.getElementById(containerId);
    if (activeContainer) {
        activeContainer.classList.add('active');
        if(containerId === 'container1')
        
            fetchAllUsernames();     
    }
}

    function toggleForm() {
        const formContainer = document.getElementById('form-container');
        formContainer.style.display = formContainer.style.display === 'none' || formContainer.style.display === '' ? 'flex' : 'none';
    }
    
    async function createGroup() {
    const name = document.getElementById('input-name').value;
    const password = document.getElementById('input-password').value;
    const userId = localStorage.getItem("userId");

    if (!name || !password) {
        document.getElementById('error-message').textContent = 'Both fields are required.';
        return;
    }

    const response = await fetch('/groups', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, userId, password })
    });

    const result = await response.json();
    if (response.status === 201) {
        addGroupToList(result);
        document.getElementById('input-name').value = '';
        document.getElementById('input-password').value = '';
        document.getElementById('error-message').textContent = '';
        document.getElementById('form-container').style.display = 'none';
    } else {
        document.getElementById('error-message').textContent = result.error;
    }
}

    async function deleteGroup(id) {
        if (confirm('Are you sure you want to delete this group?')) {
            
            const usersResponse = await fetch(`/users-by-group/${id}`);
            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users');
            }
            const { users } = await usersResponse.json();

           ///////4//////////////////////////////////////////\\\\\\\\\\\\\\\\\\\\\\\
            const userId = localStorage.getItem("userId");
            const response = await fetch(`/groups/${id}`, {
                method: 'DELETE'
            });
    
            if (response.ok) {
                document.getElementById(`group-${id}`).remove();
                alert('Group deleted successfully.');
            } else {
                const errorData = await response.json();
                alert(errorData.error);
            }
        }
    }
    async function fetchImageId(groupId) {
        // The group ID you're interested in
    
        try {
            // Send GET request to the server
            const response = await fetch(`/get-group-image/${groupId}`);
    
            // Check if the response is OK (status code 200-299)
            if (response.ok) {
                // Parse the JSON response
                const data = await response.json();
    
                // Check if imageId exists in the response
                if (data.imageId) {
                  
                   return data.imageId;
                } else {
                    return '66a3c45fdd04765c04b71740';
                }
            } else {
                alert(`Error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Handle any errors that occur during the fetch
            alert(`Error: ${error.message}`);
        }
    }  
        async function fetchImage(imageId) {
    try {
    // Send GET request to fetch image data and metadata
    const response = await fetch(`/images/id/${imageId}`);
    
    // Check if the response is OK
    if (response.ok) {
        // Extract filename from the response headers
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'image';
        if (contentDisposition) {
            const matches = /filename="(.+)"/.exec(contentDisposition);
            if (matches) {
                filename = matches[1];
            }
        }
    
        // Create a Blob from the response
        const blob = await response.blob();
    
        // Create an object URL for the Blob
        const imageUrl = URL.createObjectURL(blob);
    
        return imageUrl;
        // Optionally, if you want to download the image with the filename
      
    } else {
        return 'https://picsum.photos/1500/1500';
    }
    } catch (error) {
    // Handle any errors that occur during the fetch
    return 'https://picsum.photos/1500/1500';
    }
    }
    async   function addGroupToList(group) {
      //  alert(group._id)
        const groupsList = document.getElementById('groups');
        const listItem = document.createElement('li');
        listItem.id = `group-${group._id}`;
        const imgid=await fetchImageId(group._id);
       
 // Fetch users who are part of the group
        // Use a placeholder image or actual image URL
        const imageUrl =  await fetchImage(imgid); 
    
        listItem.innerHTML = `
            <div class="group-name">${group.name}</div>
            <div class="image-frame">
                <img src="${imageUrl}" alt="${group.name}">
            </div>
            <div class="group-buttons">
                <button onclick="joinGroup('${group._id}')">Join</button>
                <button onclick="deleteGroup('${group._id}')">Delete</button>
            </div>
        `;
        groupsList.appendChild(listItem);
    }
    
    async function fetchGroups() {
        
    const userId = localStorage.getItem("userId"); // Get userId from local storage or other sources

    try {
        const response = await fetch(`/groups/${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user groups');
        }

        const groupIds = await response.json();
     
        // Fetch details for each group
        const groupPromises = groupIds.map(async (groupId) => {
            try {  
                const groupResponse = await fetch(`/group/${groupId}`);
                if (!groupResponse.ok) {
                    throw new Error(`Failed to fetch group with ID ${groupId}`);
                }



              
                return await groupResponse.json();
            } catch (error) {
                console.error(error);
                 // Return null or a default value if an error occurs
            }
        });

        const groups = await Promise.all(groupPromises);
       
        // Add each group to the list
        groups.forEach(group => {
            if (group) {
               // alert(group.id)
                addGroupToList(group);
            }
        });

    } catch (error) {
        console.error('Error fetching groups:', error);
        // Optionally, display an error message to the user
    }
}

    
    function joinGroup(id) {
        window.location.href = `/chat?groupId=${encodeURIComponent(id)}`;
    }
  
const chatArray=[];
      async function fetchAllUsernames(chatArray) {
           
            try {
                const response = await fetch('/get-all-usernames');
                if (response.ok) {
                    const data = await response.json();
                    const { users } = data;
    
                    if (users && users.length > 0) {
                        const userListDropdown = document.getElementById('user-list-dropdown');
    
                        // Clear existing content
                        userListDropdown.innerHTML = '';
    
                        // Sort users alphabetically
                        users.sort((a, b) => a.name.localeCompare(b.name));
                        const userName=localStorage.getItem('name');
                        users.forEach(user => {
                            // For dropdown menu
                            if(chatArray.includes(user.name) || user.name==userName)
                            {}
                            else{
                            const liDropdown = document.createElement('li');
                            liDropdown.classList.add('user-item');
                            liDropdown.innerHTML = `
                           <span>${user.name}</span>
                           <button class="text-button" onclick="handleUserClick('${user.id}', '${user.name}')">Text</button>
                            `;

                            userListDropdown.appendChild(liDropdown);
                            }
                        });
                    }
                } else {
                    console.error('Error fetching usernames:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching usernames:', error);
            }
        }
    
        function toggleDropdown() {
            const dropdown = document.getElementById('user-dropdown');
            dropdown.style.display = dropdown.style.display === 'none' || dropdown.style.display === '' ? 'block' : 'none';
        }

        function filterUsers() {
            const searchInput = document.getElementById('search-input').value.toLowerCase();
            const userItems = document.querySelectorAll('#user-list-dropdown li');
            
            userItems.forEach(item => {
                const userName = item.querySelector('span').textContent.toLowerCase();
                item.style.display = userName.includes(searchInput) ? 'flex' : 'none';
            });
        }

        async function fetchAllChats() {
    try {
        const response = await fetch('/all-chats');
        if (response.ok) {
            const data = await response.json();
            const { chats } = data;

            const userList = document.getElementById('user-list');
            userList.innerHTML = ''; // Clear existing content
            const userName = localStorage.getItem('name');
            const chatArray = []; // Initialize chatArray

            if (chats && chats.length > 0) {
                chats.forEach(chat => {
                    // Create a new list item for each chat user
                    const li = document.createElement('li');
                    if (chat.users.includes(userName)) {

                        // Create user image frame
                        const img = document.createElement('img');
                        img.src = chat.userImage || 'https://picsum.photos/1500/1500'; // Set the image URL or use a placeholder
                        img.alt = 'User Image';
                        img.style.width = '40px'; // Adjust size as needed
                        img.style.height = '40px'; // Adjust size as needed
                        img.style.borderRadius = '50%'; // Make it circular
                        img.style.marginRight = '10px'; // Space between image and name

                        // Create user name span
                        const userNameSpan = document.createElement('span');
                        const user = chat.users.find(user => user !== userName) || 'Self'; // Adjust this to fit your chat data structure
                        userNameSpan.textContent = user;
                        chatArray.push(user);

                        // Create Join button
                        li.addEventListener('click', () => {
                            // Handle the join action
                            handleJoinClick(chat._id);
                        });

                        // Append image and user name span to list item
                        li.appendChild(img);
                        li.appendChild(userNameSpan);

                        // Append list item to user list
                        userList.appendChild(li);
                    }
                });

               // fetchAllUsernames(chatArray);

            } else {
                console.log('No chats found');
            }
        } else {
            console.error('Error fetching chats:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching chats:', error);
    }
}

function handleJoinClick(chatId) {
    window.location.href = `/pchat?chatId=${encodeURIComponent(chatId)}`;
       
    
}
const localUserId = localStorage.getItem('userId');
fetchAllChats();
        function handleUserClick(userId, userName) {
   // Fetch local user's ID
    const us2=localStorage.getItem('name');
  
    fetch('/create-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username1:userName,
            username2:us2,
            userId: localUserId,
            otherUserId: userId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.chatId) {
           
           window.location.reload();
            } else {
            alert('Error creating chat.');
        }
    })
    .catch(error => {
        console.error('Error creating chat:', error);
        alert('Error creating chat.');
    });
}

// Create Join button
                        document.getElementById("info").addEventListener('click', () => {
                            // Handle the join action
                            var userId=localStorage.getItem('userId');

                            window.location.href = `pinfo.html?userId=${userId}`;
                        });
    document.addEventListener('DOMContentLoaded', fetchGroups);
   
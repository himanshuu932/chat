

        /* getting group id*/
        document.addEventListener('DOMContentLoaded', async (event) => {
            const urlParams = new URLSearchParams(window.location.search);
            const groupId = urlParams.get('groupId');
            const changeImagePopup=document.getElementById('change-image-popup');
           var currentImageId="";
            if (!groupId) {
                alert('Group ID not found!');
                window.location.href = "/groups.html";
                return;
            
             }
        
           
            async function fetchGroupInfo(groupId) {
    try {
        const response = await fetch(`/group/${groupId}`);

        if (response.ok) {
            const data = await response.json();
            const { name, members } = data;

            // Update group name and user count
            document.getElementById('group-name').textContent = name;
            document.getElementById('user-count').textContent = `${members.length} Users`;
            const memberDetails = await Promise.all(members.map(async (userId) => {
                const result = await fetch(`/getusername/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const resultData = await result.json();
                const name=resultData.username
                const isAdmin = await checkIfUserIsAdmin(userId);
                return {
                    
                    name: name,
                    isAdmin: isAdmin
                };
            }));

            // Sort users: Admins first, then alphabetically
            memberDetails.sort((a, b) => {
                if (a.isAdmin && !b.isAdmin) return -1;
                if (!a.isAdmin && b.isAdmin) return 1;
                return a.name.localeCompare(b.name);
            });

            // Clear the user list
            const userList = document.getElementById('user-list');
            userList.innerHTML = '';

            // Add sorted users to the list
            for (const user of memberDetails) {
                const li = document.createElement('li');
                li.textContent = user.name;

                if (user.isAdmin) {
                    const adminLabel = document.createElement('span');
                    adminLabel.textContent = 'Admin';
                    adminLabel.className = 'admin-label';
                    li.appendChild(adminLabel);
                }

                userList.appendChild(li);
            }
          

           
        } else {
            console.error(`Error fetching group information: ${response.status} ${response.statusText}`);
            alert('Error fetching group information');
        }
    } catch (error) {
        console.error('Error in fetchGroupInfo:', error);
        alert('An unexpected error occurred while fetching group information');
    }
}

async function fetchAllUsernames() {
    try {
        const response = await fetch('/get-all-usernames');

        if (response.ok) {
            const data = await response.json();
            const { users } = data;

            if (users && users.length > 0) {
                const popupMenu = document.getElementById('popup-menu');
                popupMenu.innerHTML = ''; // Clear existing content

                const groupMembersResponse = await fetch(`/group/${groupId}`);
                const groupMembersData = await groupMembersResponse.json();
                const members = groupMembersData.members;

                // Add admin status to user objects
                for (const user of users) {
                    user.isAdmin = await checkIfUserIsAdmin(user.id);
                }

                // Sort users: Admins first, then alphabetically
                users.sort((a, b) => {
                    if (a.isAdmin && !b.isAdmin) return -1;
                    if (!a.isAdmin && b.isAdmin) return 1;
                    return a.name.localeCompare(b.name);
                });

                users.forEach(async (user) => {
                    const div = document.createElement('div');
                    
                    const userNameSpan = document.createElement('span');
                    userNameSpan.textContent = user.name;

                    if (user.isAdmin) {
                        const adminLabel = document.createElement('span');
                        adminLabel.textContent = ' admin'; // Added space before "admin"
                        adminLabel.className = 'admin-label';
                        userNameSpan.appendChild(adminLabel);
                    }

                    div.appendChild(userNameSpan);

                    // Show or hide tick and cross buttons
                    const tickButton = document.createElement('button');
                    tickButton.innerHTML = '<i class="fas fa-check tick"></i>';
                    tickButton.style.display = members.includes(user.id) ? 'none' : 'inline-block';

                    const crossButton = document.createElement('button');
                    crossButton.innerHTML = '<i class="fas fa-times cross"></i>';
                    crossButton.style.display = members.includes(user.id) && !user.isAdmin ? 'inline-block' : 'none';

                    tickButton.addEventListener('click', async () => {
                        try {
                            const result = await fetch('/add-user-to-group', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ groupId, userId: user.id })
                            });
                            const resultData = await result.json();
                            if (resultData.success) {
                                console.log('User added to group successfully');
                                fetchGroupInfo(groupId); // Refresh group info
                                fetchAllUsernames(); 
                               // Refresh popup menu content
                            } else {
                                console.error('Error adding user to group');
                            }
                        } catch (error) {
                            console.error('Error adding user to group:', error);
                        }
                    });

                    crossButton.addEventListener('click', async () => {
                        try {
                            const result = await fetch('/remove-user-from-group', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ groupId, userId: user.id })
                            });
                            const resultData = await result.json();
                            if (resultData.success) {
                                console.log('User removed from group successfully');
                                fetchGroupInfo(groupId); // Refresh group info
                                fetchAllUsernames();    // Refresh popup menu content
                            } else {
                                console.error('Error removing user from group');
                            }
                        } catch (error) {
                            console.error('Error removing user from group:', error);
                        }
                    });

                    div.appendChild(tickButton);
                    div.appendChild(crossButton);
                    popupMenu.appendChild(div);
                });

                popupMenu.style.display = 'block'; // Show the popup menu
            }
        } else {
            console.error('Error fetching all usernames');
        }
    } catch (error) {
        console.error('Error fetching all usernames:', error);
    }
}

async function checkIfUserIsAdmin(userId) {
    try {
        const response = await fetch(`/is-admin/${groupId}/${userId}`);
        if (response.ok) {
            const data = await response.json();
            return data.isAdmin; // Assuming the response contains { isAdmin: true/false }
        } else {
            console.error('Error checking admin status');
            return false;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

async function checkIfUserIsAdmin(userId) {
    try {
        const response = await fetch(`/is-admin/${groupId}/${userId}`);
        if (response.ok) {
            const data = await response.json();
            return data.isAdmin; // Assuming the response contains { isAdmin: true/false }
        } else {
            console.error('Error checking admin status');
            return false;
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

            document.getElementById('add-user-button').addEventListener('click', () => {
            fetchAllUsernames();
            });

            await fetchGroupInfo(groupId);

            document.getElementById('back-button').addEventListener('click', () => {
                window.location.href = `chat.html?groupId=${groupId}`;
            });

            document.getElementById('chat-button').addEventListener('click', () => {
                window.location.href = `chat.html?groupId=${groupId}`;
            });

           
    // Function to hide popup menu
    function hidePopupMenu() {
        document.getElementById('popup-menu').style.display = 'none';
    }

    // Hide popup menu when clicking outside of it
    document.addEventListener('click', (event) => {
        const popupMenu = document.getElementById('popup-menu');
        const addButton = document.getElementById('add-user-button');

        if (!popupMenu.contains(event.target) && event.target !== addButton) {
            hidePopupMenu();
        }
        if (!changeImagePopup.contains(event.target) && event.target !== document.getElementById('upload-image-button')) {
          changeImagePopup.style.display='none';
        }
    });
        
   
 
    
       // Elements
     
    
              
            const uploadForm = document.getElementById('uploadForm');
            const uploadImageButton=document.getElementById('upload-image-button');
            const imageUploadInput = document.querySelector('input[type="file"]');
            let images = [];
            let currentIndex = 0;
         
            uploadImageButton.addEventListener('click', function() {
                // Toggle the visibility of the popup
                if (changeImagePopup.style.display === 'none' || changeImagePopup.style.display === '') {
                    changeImagePopup.style.display = 'block';
                } else {
                    changeImagePopup.style.display = 'none';
                }
            });
                 async function fetchImageId() {
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
                        currentImageId=data.imageId;
                        fetchImage(data.imageId);
                    } else {
                        alert('No image ID found for the specified group.');
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

            // Set the image source and filename to display or download
            const imgElement = document.getElementById('group-image');
            imgElement.src = imageUrl;
            imgElement.alt = filename;
            

            // Optionally, if you want to download the image with the filename
          
        } else {
            alert(`Error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        // Handle any errors that occur during the fetch
        alert(`Error: ${error.message}`);
    }
}
    
        // Handle image upload
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('image', imageUploadInput.files[0]);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.fileId) {
                    
                    changeImagePopup.style.display='none';
                    updateGroup(data.fileId);
                } else {
                    alert(`Upload failed: ${data.error}`);
                }
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        });
            // Fetch all images from the server
         async function updateGroup(imageId)
         {  alert(`${imageId}  .....${ currentImageId}`);
            if( currentImageId!='66a53230fbc60a6e879983d2')
            try {
                const response = await fetch(`/images/id/${currentImageId}`, {
                  method: 'DELETE'
                });
        
                if (response.ok) {
                  alert('Image deleted successfully');
                  // Refresh the image list after deletion
                } else {
                  const data = await response.json();
                  alert('Deletion failed: ' + data.error);
                }
            }
            catch (err) {
                console.error('Error:', err);
              }
            try {
                const response = await fetch(`/group/${groupId}/image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageId: imageId }),
                });

                const result = await response.json();

             
                if (response.ok) {
                  alert(`Success: ${result.group.name} updated with new image ID.`);
                  fetchImage(imageId);

                  
                } else {
                    alert(result);
                }
            } catch (error) {
              alert(error);
            }
                      }                                                    
            // Initialize by fetching images
            window.onload = fetchImageId;      
          
       
       
       
            document.addEventListener('DOMContentLoaded', function() {
                const uploadForm = document.getElementById('uploadForm');
                const uploadImageButton=document.getElementById('upload-image-button');
                const imageUploadInput = document.querySelector('input[type="file"]');
                let images = [];
                let currentIndex = 0;
                const groupId = "66a2980618ebe2cdfbb04a18";
                uploadImageButton.addEventListener('click', function() {
                    // Toggle the visibility of the popup
                    if (changeImagePopup.style.display === 'none' || changeImagePopup.style.display === '') {
                        changeImagePopup.style.display = 'block';
                    } else {
                        changeImagePopup.style.display = 'none';
                    }
                });
                async function fetchImageId() {
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
                            
                            fetchImage(data.imageId);
                        } else {
                            alert('No image ID found for the specified group.');
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
    
                // Set the image source and filename to display or download
                const imgElement = document.getElementById('group-image');
                imgElement.src = imageUrl;
                imgElement.alt = filename;
                
    
                // Optionally, if you want to download the image with the filename
              
            } else {
                alert(`Error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            // Handle any errors that occur during the fetch
            alert(`Error: ${error.message}`);
        }
    }
        
            // Handle image upload
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
    
                const formData = new FormData();
                formData.append('image', imageUploadInput.files[0]);
    
                try {
                    const response = await fetch('/upload', {
                        method: 'POST',
                        body: formData
                    });
    
                    const data = await response.json();
    
                    if (data.fileId) {
                        
                        
                        updateGroup(data.fileId);
                    } else {
                        alert(`Upload failed: ${data.error}`);
                    }
                } catch (err) {
                    alert(`Error: ${err.message}`);
                }
            });
                // Fetch all images from the server
             async function updateGroup(imageId)
             {  alert(imageId);
    
                try {
                    const response = await fetch(`/group/${groupId}/image`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ imageId: imageId }),
                    });
    
                    const result = await response.json();
    
                 
                    if (response.ok) {
                      alert(`Success: ${result.group.name} updated with new image ID.`);
                      fetchImage(imageId);
                      
                    } else {
                        alert(result);
                    }
                } catch (error) {
                  alert(error);
                }
                          }                                                    
                // Initialize by fetching images
                window.onload = fetchImageId; 
            });
      
       
       
       
               
    });
/* getting group id*/
document.addEventListener('DOMContentLoaded', async (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const groupId = urlParams.get('groupId');
    const changeImagePopup=document.getElementById('change-image-popup');
    const uploadForm = document.getElementById('uploadForm');
    const uploadImageButton=document.getElementById('upload-image-button');
    const imageUploadInput = document.querySelector('input[type="file"]');
    const currentname=urlParams.get('username');

    
    checkIfUserIsAdmin(localStorage.getItem('userId'))
        .then(isAdmin => {
            if(!isAdmin)
            document.getElementById('add-user-button').style.display='none';
           
        })
        .catch(error => {
            console.error('Error checking admin status:', error);
            alert('Failed to check admin status');
        });
    var currentImageId="";
    if (!groupId) {
        alert('Group ID not found!');
        window.location.href = "/groups.html";
        return;
    
     }

   
    async function fetchGroupInfo(groupId) {
try {await fetchImageId();  
const response = await fetch(`/groupinfo/${groupId}`);

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

        const groupMembersResponse = await fetch(`/groupinfo/${groupId}`);
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
                    const response = await fetch(`/users/${user.id}/groups`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ groupId })
                    });
            
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
            
                    const updatedUser = await response.json();
                    console.log('Group added successfully:', updatedUser);
                    // Optionally update the UI to reflect the change
                } catch (error) {
                    console.error('Error adding group:', error);
                }
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
                    const response = await fetch(`/users/${user.id}/groups/${groupId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    });
            
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
            
                    const updatedUser = await response.json();
                    console.log('Group removed successfully:', updatedUser);
                    // Optionally update the UI to reflect the change
                } catch (error) {
                    console.error('Error removing group:', error);
                }
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

    await fetchGroupInfo(groupId);

    document.getElementById('add-user-button').addEventListener('click', () => {
    fetchAllUsernames();
    });
    document.getElementById('back-button').addEventListener('click', () => {
        window.history.back();
    });
    document.getElementById('chat-button').addEventListener('click', () => {
        window.history.back();
    });

   


// Hide popup menu when clicking outside of it
    document.addEventListener('click', (event) => {
const popupMenu = document.getElementById('popup-menu');
const addButton = document.getElementById('add-user-button');

if (!popupMenu.contains(event.target) && event.target !== addButton) {
    document.getElementById('popup-menu').style.display = 'none';
}
if (!changeImagePopup.contains(event.target) && event.target !== document.getElementById('upload-image-button')) {
  changeImagePopup.style.display='none';
}
    });


  uploadImageButton.addEventListener('click', function() {
        // Toggle the visibility of the popup
        if (changeImagePopup.style.display === 'none' || changeImagePopup.style.display === '') {
            changeImagePopup.style.display = 'block';
        } else {
            changeImagePopup.style.display = 'none';
        }
    });

  async function fetchImageId() {
    try {
       
        const response = await fetch(`/get-group-image/${groupId}`);
        if (response.ok) {
            const data = await response.json();
             if (data.imageId) {
                currentImageId=data.imageId;
                await fetchImage(data.imageId);
            } else {
                alert('No image ID found for the specified group.');
            }
        } else {
            alert(`Error: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
       
        alert(`Error: ${error.message}`);
    }
}

async function fetchImage(imageId) {
    try {
        const response = await fetch(`/images/id/${imageId}`);
        if (response.ok) {
            const data = await response.blob();
            const imageUrl = URL.createObjectURL(data);
            document.getElementById('group-image').src = imageUrl;
        } else {
            console.error('Error fetching image:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error in fetchImage:', error);
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
           await updateGroup(data.fileId);
        } else {
            alert(`Upload failed: ${data.error}`);
        }
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

async function deleteimg(){
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
    }

async function updateGroup(imageId)
 { 
    if( currentImageId!='66cf95f896d2457a8b9d0e08')
    await deleteimg();

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
          await fetchImage(imageId);

          
        } else {
            alert(result);
        }
    } catch (error) {
      alert(error);
    }
              }                                                    
        
  



       
});
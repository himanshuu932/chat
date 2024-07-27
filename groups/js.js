
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
        const userId = localStorage.getItem("userId");
        const response = await fetch(`/groups/${id}/${userId}`, {
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
    const groupsList = document.getElementById('groups');
    const listItem = document.createElement('li');
    listItem.id = `group-${group._id}`;
    const imgid=await fetchImageId(group._id);
   
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
const response = await fetch('/groups');
const groups = await response.json();

groups.forEach(group => {
addGroupToList(group);

});
}

function joinGroup(id) {
    window.location.href = `/chat?groupId=${encodeURIComponent(id)}`;
}

document.addEventListener('DOMContentLoaded', fetchGroups);

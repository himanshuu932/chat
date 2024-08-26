/* getting group id*/
document.addEventListener('DOMContentLoaded', async (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const changeImagePopup=document.getElementById('change-image-popup');
    const uploadForm = document.getElementById('uploadForm');
    const uploadImageButton=document.getElementById('upload-image-button');
    const imageUploadInput = document.querySelector('input[type="file"]');
    const currentname=urlParams.get('username');
    const e = document.getElementById('edit-button');
    if (userId !== localStorage.getItem('userId')) {
        e.style.display = 'none';
    }
    
   
    
 

    async function fetchUserDetails(userId) {
        try {
            const response = await fetch(`/user/${userId}`);
    
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
    
            // Parse the response as JSON
            const user = await response.json();
    
            // Display user details on the page
            document.getElementById('name').textContent = user.name;
            document.getElementById('email').textContent = user.email;
            document.getElementById('about').textContent = user.about || 'No about info';
    
            // Display user's groups
            const groupsContainer = document.getElementById('phone');
            user.groups.forEach(groupId => {
                fetch(`/group/${groupId}`)
                    .then(response => response.json())
                    .then(group => {
                        const groupElement = document.createElement('div');
                        groupElement.textContent = group.name; // Assuming the group response has a name field
                        groupsContainer.appendChild(groupElement);
                    })
                    .catch(err => console.error('Error fetching group:', err));
            });
    
        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    }
    

   fetchUserDetails(userId);
    document.getElementById('back-button').addEventListener('click', () => {
        window.history.back();
    });
    
   

   


// 

  
  

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
    if( currentImageId!='66a53230fbc60a6e879983d2')
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
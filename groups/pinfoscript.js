document.addEventListener('DOMContentLoaded', async (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const changeImagePopup = document.getElementById('change-image-popup');
    const changeImageButton = document.getElementById('change-image-button');
    const overlay = document.getElementById('overlay');
    const uploadForm = document.getElementById('uploadForm');
    const imageUploadInput = document.getElementById('file-upload');
    const editButton = document.getElementById('edit-button');
    let currentImageId;

    if (userId !== localStorage.getItem('userId')) {
        editButton.style.display = 'none';
        changeImageButton.style.display='none';
    }

    let isEditing = false;
    let originalNameElement;
    let originalAboutElement;
    function enableEditing() {
        const nameElement = document.getElementById('name');
        const aboutElement = document.getElementById('about');
    
        if (!isEditing) {
            originalNameElement = nameElement.cloneNode(true);
            originalAboutElement = aboutElement.cloneNode(true);
    
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = nameElement.textContent.trim();
            nameInput.id = 'name-input';
    
            const aboutInput = document.createElement('textarea');
            aboutInput.value = aboutElement.textContent.trim();
            aboutInput.id = 'about-input';
    
            nameElement.replaceWith(nameInput);
            aboutElement.replaceWith(aboutInput);
    
            editButton.textContent = 'Save Info';
            isEditing = true;
        } else {
            const nameInput = document.getElementById('name-input');
            const aboutInput = document.getElementById('about-input');
    
            const newName = nameInput.value.trim();
            const newAbout = aboutInput.value.trim();
            const prevName = originalNameElement.textContent.trim(); // Save the previous name
    
            fetch(`/changeinfo/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName, prevName: prevName, about: newAbout }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("User updated:", data);
                localStorage.setItem('name',newName);
                originalNameElement.textContent = newName;
                originalAboutElement.textContent = newAbout;
    
                nameInput.replaceWith(originalNameElement);
                aboutInput.replaceWith(originalAboutElement);
    
                editButton.textContent = 'Edit Info';
                isEditing = false;
            })
            .catch(error => {
                console.error('There was a problem with the fetch operation:', error);
                alert('Failed to update user information. Please try again.');
    
                nameInput.replaceWith(originalNameElement);
                aboutInput.replaceWith(originalAboutElement);
    
                editButton.textContent = 'Edit Info';
                isEditing = false;
            });
        }
    }
    

    editButton.addEventListener('click', enableEditing);

    async function fetchUserDetails(userId) {
        try {
            const response = await fetch(`/user/${userId}`);
            if (!response.ok) {
                throw new Error(`Error: ${response.statusText}`);
            }
            const user = await response.json();

            document.getElementById('name').textContent = user.name;
            document.getElementById('email').textContent = user.email;
            document.getElementById('about').textContent = user.about || 'No about info';
            currentImageId = user.dp;
            fetchImage(user.dp);

            const groupsContainer = document.getElementById('phone');
            groupsContainer.innerHTML = '';

            if (user.groups.length > 0) {
                const groupPromises = user.groups.map(groupId => {
                    return fetch(`/group/${groupId}`)
                        .then(response => response.json())
                        .then(group => {
                            const groupElement = document.createElement('div');
                            groupElement.textContent = group.name;
                            groupsContainer.appendChild(groupElement);
                        });
                });

                await Promise.all(groupPromises);
            } else {
                const noGroupsElement = document.createElement('div');
                noGroupsElement.textContent = "No groups";
                groupsContainer.appendChild(noGroupsElement);
            }

        } catch (error) {
            console.error('Failed to fetch user details:', error);
        }
    }

    async function fetchImage(imageId) {
        try {
            const response = await fetch(`/images/id/${imageId}`);
            if (response.ok) {
                const data = await response.blob();
                const imageUrl = URL.createObjectURL(data);
                document.getElementById('profile-img').src = imageUrl;
            } else {
                console.error('Error fetching image:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error in fetchImage:', error);
        }
    }

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
                changeImagePopup.style.display = 'none';
                await updateProfileImage(data.fileId);
            } else {
                alert(`Upload failed: ${data.error}`);
            }
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    });

    async function deleteimg() {
        try {
            const response = await fetch(`/images/id/${currentImageId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Image deleted successfully');
            } else {
                const data = await response.json();
                console.error('Deletion failed:', data.error);
            }
        } catch (err) {
            console.error('Error:', err);
        }
    }

    async function updateProfileImage(imageId) {
        if (currentImageId && currentImageId !== 'default-image-id') {
            await deleteimg();
        }

        try {
            const response = await fetch(`/user/${userId}/update-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageId: imageId }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`Profile updated with new image ID: ${imageId}`);
                await fetchImage(imageId);
            } else {
                alert(`Update failed: ${result.error}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    fetchUserDetails(userId);

    document.getElementById('back-button').addEventListener('click', () => {
        window.history.back();
    });

    function toggleImageUploadPopup() {
        changeImagePopup.classList.toggle('show');
        overlay.classList.toggle('show');
    }

    changeImageButton.addEventListener('click', toggleImageUploadPopup);
    overlay.addEventListener('click', toggleImageUploadPopup);
});

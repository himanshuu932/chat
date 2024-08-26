  
    document.addEventListener('DOMContentLoaded', async (event) => { // Clear forms on page load
      
            
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('emaillogin').value;
            const password = document.getElementById('passwordlogin').value;
            
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                const messageElement = document.getElementById('messagelogin');
                
                if (response.ok) {
                    messageElement.style.color = 'green';
                    messageElement.style.left='15%';
                    messageElement.textContent = 'User authenticated successfully';
                  
                    // Save name to local storage
                    localStorage.setItem('name', data.name);
                    localStorage.setItem('userId', data.id);
                    
                    setTimeout(() => {
                        document.getElementById('login-form').reset();
                        messageElement.textContent = '';
                        window.location.href = `/groups.html?name=${encodeURIComponent(data.name)}`;
                    }, 1000);
                } else {
                    messageElement.style.color = 'red';
                    messageElement.style.left='30%';
                    messageElement.textContent = data.msg || 'An error occurred';
                }
            } catch (err) {
                const messageElement = document.getElementById('messagelogin');
                messageElement.style.color = 'red';
                messageElement.style.left='30%';
                messageElement.textContent = 'Server error';
            }
        });

        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('namesg').value;
            const email = document.getElementById('emailsg').value;
            const password = document.getElementById('passwordsg').value;
            try {
                const response = await fetch('/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                const messageElement = document.getElementById('messagesg');
                if (response.ok) {
                    messageElement.style.color = 'green';
                    messageElement.style.left='15%';
                    messageElement.textContent = 'User registered successfully';
                    
                    setTimeout(() => {
                        document.getElementById('signup-form').reset();
                        messageElement.textContent = '';
                        window.location.href = '/login.html';
                    }, 1000);
                } else {
                    messageElement.style.color = 'red';
                    messageElement.style.left='30%';
                    messageElement.textContent = data.msg; // Changed from `data.message` to `data.msg`
                }
            } catch (err) {
                const messageElement = document.getElementById('messagesg');
                messageElement.style.color = 'red';
                messageElement.style.left='30%';
                messageElement.textContent = 'An error occurred';
            }
        }); });
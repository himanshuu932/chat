// Listen for push events
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/path/to/icon.png',  // Replace with the path to your icon
        data: {
            url: data.url  // URL to open when notification is clicked
        }
    };

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    event.notification.close();  // Close the notification

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            if (clientList.length > 0) {
                // If there's an open window, focus it
                return clientList[0].focus();
            }
            // Otherwise, open a new window/tab
            return clients.openWindow(event.notification.data.url);
        })
    );
});

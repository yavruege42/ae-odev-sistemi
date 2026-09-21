self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : { title: "AE Ödev Sistemi", body: "Yeni bir bildirim var." };
    
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233491.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3233/3233491.png'
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
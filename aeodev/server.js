const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// VAPID Anahtarları (Push bildirimleri için gerekli)
const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const privateVapidKey = '1234567890abcdefghijklmnopqrstuvwxyzABCDEF';

webpush.setVapidDetails('mailto:destek@aeodev.com', publicVapidKey, privateVapidKey);

// Bağlanan cihazların abonelik listesi
let subscriptions = [];

// Cihazlar bildirim izni verince buraya kaydedilir
app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
    }
    res.status(201).json({ message: "Cihaz başarıyla kaydedildi." });
});

// Ödev yayınlandığında tüm cihazlara bildirim yollar
app.post('/api/publish-homework', (req, res) => {
    const { title, subject, desc } = req.body;
    
    const payload = JSON.stringify({
        title: `Yeni Ödev: ${subject}`,
        body: `${title} - ${desc}`
    });

    Promise.all(subscriptions.map(sub => 
        webpush.sendNotification(sub, payload).catch(err => console.error("Bildirim hatası:", err))
    ))
    .then(() => res.status(200).json({ success: true, message: "Tüm cihazlara bildirim gönderildi!" }))
    .catch(err => res.status(500).json({ error: "Bildirimler gönderilemedi." }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AE Ödev Sistemi ${PORT} portunda çalışıyor...`));
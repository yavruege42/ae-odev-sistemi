const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const privateVapidKey = 'DH4q58L42wN3_o619r0V6l7rQ87Z789hI091K2lM5o8'; 

webpush.setVapidDetails('mailto:destek@aeodev.com', publicVapidKey, privateVapidKey);

let subscriptions = [];
let homeworks = [];

app.post('/api/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscriptions.some(sub => sub.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
    }
    res.status(201).json({ message: "Cihaz kaydedildi." });
});

app.get('/api/homeworks', (req, res) => {
    res.json(homeworks);
});

app.post('/api/publish-homework', (req, res) => {
    const { title, subject, desc, status } = req.body;
    
    const newHomework = {
        id: Date.now(),
        subject,
        title,
        desc,
        status: status || 'yapti' // Öğretmenin seçtiği başlangıç durumu
    };
    homeworks.unshift(newHomework);

    const payload = JSON.stringify({
        title: `Yeni Ödev: ${subject}`,
        body: `${title} - ${desc}`
    });

    Promise.all(subscriptions.map(sub => 
        webpush.sendNotification(sub, payload).catch(err => console.error(err))
    ))
    .then(() => res.status(200).json({ success: true }))
    .catch(err => res.status(500).json({ error: "Hata" }));
});

app.post('/api/update-status', (req, res) => {
    const { id, status } = req.body;
    const hw = homeworks.find(h => h.id === id);
    if(hw) {
        hw.status = status;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: "Bulunamadı" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Çalışıyor: ${PORT}`));

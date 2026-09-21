let currentUser = JSON.parse(localStorage.getItem('ae_user')) || null;
let homeworks = JSON.parse(localStorage.getItem('ae_homeworks')) || [];
const publicVapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

window.onload = function() {
    if (!currentUser) {
        document.getElementById('setup-modal').classList.remove('hidden');
    } else {
        initApp();
        registerPush();
    }
};

async function registerPush() {
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register('/sw.js');
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });

            await fetch('/api/subscribe', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: { 'content-type': 'application/json' }
            });
        } catch (err) {
            console.error("Push kayıt hatası:", err);
        }
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function saveUserAndRole(e) {
    e.preventDefault();
    currentUser = {
        name: document.getElementById('input-name').value.trim(),
        role: document.getElementById('input-role').value
    };
    localStorage.setItem('ae_user', JSON.stringify(currentUser));
    document.getElementById('setup-modal').classList.add('hidden');
    initApp();
    registerPush();
}

function resetUser() {
    localStorage.removeItem('ae_user');
    location.reload();
}

function initApp() {
    document.getElementById('display-username').innerHTML = `<i class="fa-solid fa-user mr-1.5"></i> ${currentUser.name} (${currentUser.role === 'ogretmen' ? 'Öğretmen' : 'Öğrenci'})`;
    if (currentUser.role === 'ogretmen') {
        document.getElementById('teacher-panel').classList.remove('hidden');
        renderTeacherHomeworks();
    } else {
        document.getElementById('student-panel').classList.remove('hidden');
        renderStudentHomeworks();
    }
}

async function handleCreateHomework(e) {
    e.preventDefault();
    const title = document.getElementById('hw-title').value;
    const subject = document.getElementById('hw-subject').value;
    const desc = document.getElementById('hw-desc').value;
    const deadline = document.getElementById('hw-deadline').value;

    const newHw = { id: 'hw_' + Date.now(), title, subject, desc, deadline, author: currentUser.name };
    homeworks.unshift(newHw);
    localStorage.setItem('ae_homeworks', JSON.stringify(homeworks));

    // Sunucuya istek atılır ve kayıtlı tüm cihazlara gerçek push bildirimi gider
    await fetch('/api/publish-homework', {
        method: 'POST',
        body: JSON.stringify({ title, subject, desc }),
        headers: { 'content-type': 'application/json' }
    });

    document.getElementById('hw-title').value = '';
    document.getElementById('hw-subject').value = '';
    document.getElementById('hw-desc').value = '';
    document.getElementById('hw-deadline').value = '';

    renderTeacherHomeworks();
    alert("Ödev yayınlandı ve bağlı tüm cihazlara push bildirim gönderildi!");
}

function renderTeacherHomeworks() {
    const list = document.getElementById('teacher-hw-list');
    list.innerHTML = homeworks.map(hw => `<div class="border p-4 rounded-lg bg-slate-50"><h3 class="font-bold">${hw.subject}: ${hw.title}</h3><p class="text-sm">${hw.desc}</p></div>`).join('') || '<p class="text-slate-400">Henüz ödev yok.</p>';
}

function renderStudentHomeworks() {
    const list = document.getElementById('student-hw-list');
    list.innerHTML = homeworks.map(hw => `<div class="border p-4 rounded-lg bg-white"><h3 class="font-bold">${hw.subject}: ${hw.title}</h3><p class="text-sm">${hw.desc}</p></div>`).join('') || '<p class="text-slate-400">Aktif ödev yok.</p>';
}
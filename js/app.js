// --- DATA STORE ---
// Status: 'todo', 'in-progress', 'done'
let tasksData = [];
let consentStatus = null;

let currentFilter = 'all';
let progressChartInstance = null;
let distributionChartInstance = null;

// --- INDEXEDDB CONFIG ---
const DB_NAME = 'tasks-db';
const DB_STORE = 'tasks';
const DB_VERSION = 1;
const dbPromise = initDB();
const CONSENT_KEY = 'cookieConsent';
const FILTER_COOKIE = 'todoFilter';

document.addEventListener('DOMContentLoaded', async () => {
    consentStatus = getCookieConsent();
    if (consentStatus === 'refused') {
        await clearTasksDB();
    }
    if (isConsentGranted()) {
        await loadTasksFromDB();
    }
    applySavedFilter();
    renderApp();
    setupForm();
    setFooterDate();
    initCookieBanner();
});

function setupForm() {
    const form = document.getElementById('task-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('task-input');
        const category = document.getElementById('category-input').value;
        
        if (input.value.trim()) {
            const newTask = {
                id: Date.now(),
                title: input.value.trim(),
                category: category,
                categoryLabel: category === 'priority' ? 'Priorité Absolue' : 'Projet A',
                status: 'todo'
            };
            tasksData.unshift(newTask);
            input.value = '';
            await saveTaskToDB(newTask);
            renderApp();
        }
    });
}

function renderApp() {
    updateStats();
    renderTaskList();
    updateCharts();
}

function updateStats() {
    document.getElementById('todo-count').textContent = tasksData.filter(t => t.status === 'todo').length;
    document.getElementById('progress-count').textContent = tasksData.filter(t => t.status === 'in-progress').length;
    document.getElementById('done-count').textContent = tasksData.filter(t => t.status === 'done').length;
}

function renderTaskList() {
    const container = document.getElementById('task-list');
    container.innerHTML = '';
    const filteredTasks = currentFilter === 'all' ? tasksData : tasksData.filter(t => t.category === currentFilter);

    filteredTasks.forEach(task => {
        const color = task.category === 'priority' ? 'orange' : 'blue';
        const statusClasses = {
            'todo': 'bg-stone-100 text-stone-600',
            'in-progress': 'bg-blue-100 text-blue-600',
            'done': 'bg-green-100 text-green-600'
        };
        const statusLabels = { 'todo': 'A faire', 'in-progress': 'En cours', 'done': 'Termine' };

        container.innerHTML += `
            <div class="bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border border-${color}-200 bg-${color}-50 text-${color}-700">
                                ${task.categoryLabel}
                            </span>
                            <span class="status-badge ${statusClasses[task.status]}">
                                ${statusLabels[task.status]}
                            </span>
                        </div>
                        <h4 class="font-bold text-stone-800 ${task.status === 'done' ? 'line-through opacity-50' : ''}">${task.title}</h4>
                    </div>
                    
                    <div class="flex items-center gap-1 shrink-0">
                        <select onchange="updateTaskStatus(${task.id}, this.value)" 
                                class="text-xs bg-stone-50 border border-stone-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500">
                            <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>A faire</option>
                            <option value="in-progress" ${task.status === 'in-progress' ? 'selected' : ''}>En cours</option>
                            <option value="done" ${task.status === 'done' ? 'selected' : ''}>Termine</option>
                        </select>
                        <button onclick="deleteTask(${task.id})" class="text-stone-300 hover:text-red-500 px-2 transition-colors">?</button>
                    </div>
                </div>
            </div>
        `;
    });
}

window.updateTaskStatus = function(id, newStatus) {
    const task = tasksData.find(t => t.id === id);
    if (task) {
        task.status = newStatus;
        saveTaskToDB(task);
        renderApp();
    }
};

window.deleteTask = function(id) {
    tasksData = tasksData.filter(t => t.id !== id);
    deleteTaskFromDB(id);
    renderApp();
};

window.filterTasks = function(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.dataset.filter === filter;
        btn.className = isActive 
            ? "filter-btn active px-4 py-2 rounded-full text-sm font-medium transition-colors bg-stone-800 text-white shadow-md"
            : "filter-btn px-4 py-2 rounded-full text-sm font-medium transition-colors bg-white text-stone-600 border border-stone-200 hover:bg-stone-50";
    });
    if (isConsentGranted()) {
        setCookie(FILTER_COOKIE, filter, 180);
    }
    renderTaskList();
};

function updateCharts() {
    const ctxProg = document.getElementById('progressChart').getContext('2d');
    const ctxDist = document.getElementById('distributionChart').getContext('2d');

    if (progressChartInstance) progressChartInstance.destroy();
    if (distributionChartInstance) distributionChartInstance.destroy();

    // 1. PROGRESS BAR CHART (STACKED)
    progressChartInstance = new Chart(ctxProg, {
        type: 'bar',
        data: {
            labels: ['Statut des taches'],
            datasets: [
                { 
                    label: 'A faire', 
                    data: [tasksData.filter(t => t.status === 'todo').length], 
                    backgroundColor: '#d6d3d1', // Stone 300
                    borderRadius: 6
                },
                { 
                    label: 'En cours', 
                    data: [tasksData.filter(t => t.status === 'in-progress').length], 
                    backgroundColor: '#3b82f6', // Blue 500
                    borderRadius: 6
                },
                { 
                    label: 'Termine', 
                    data: [tasksData.filter(t => t.status === 'done').length], 
                    backgroundColor: '#22c55e', // Green 500
                    borderRadius: 6
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, display: false },
                y: { stacked: true, display: false }
            },
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            }
        }
    });

    // 2. DISTRIBUTION CHART
    distributionChartInstance = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
            labels: ['Priorites', 'Projets'],
            datasets: [{
                data: [
                    tasksData.filter(t => t.category === 'priority').length,
                    tasksData.filter(t => t.category === 'work').length
                ],
                backgroundColor: ['#f97316', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });
}

// --- COOKIE CONSENT ---
function getCookieConsent() {
    let c = getCookie(CONSENT_KEY);
    if (c === null || c === undefined || c === 'null' || c === 'undefined') {
        c = null;
    }
    if (!c) {
        let ls = localStorage.getItem(CONSENT_KEY);
        if (ls === 'null' || ls === 'undefined') ls = null;
        c = ls || null;
    }
    return c;
}

function setCookieConsent(status) {
    consentStatus = status;
    localStorage.setItem(CONSENT_KEY, status);
    if (status === 'refused') {
        deleteCookie(CONSENT_KEY);
        deleteCookie(FILTER_COOKIE);
    } else {
        setCookie(CONSENT_KEY, status, 180);
    }
}

function isConsentGranted(status = consentStatus) {
    return status === 'accepted' || status === 'personalized';
}

function initCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    try {
        const current = consentStatus || getCookieConsent();
        if (current === 'refused' || isConsentGranted(current)) {
            // Consent already given/refused: remove banner if present
            banner.remove();
            return;
        }
        document.getElementById('cookie-accept')?.addEventListener('click', handleCookieAccept);
        document.getElementById('cookie-customize')?.addEventListener('click', handleCookieCustomize);
        document.getElementById('cookie-refuse')?.addEventListener('click', handleCookieRefuse);
        showCookieBanner();
    } catch (err) {
        console.error('Erreur initialisation bandeau cookies', err);
        // As a fallback, make sure banner is visible so user can interact
        banner.classList.remove('hidden');
    }
}

function showCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const card = banner.querySelector('div');
    banner.classList.remove('hidden');
    // Force layout before toggling classes to ensure animation triggers
    void card.offsetHeight;
    requestAnimationFrame(() => {
        card.classList.remove('opacity-0', 'translate-y-4');
    });
}

function hideCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    const card = banner.querySelector('div');
    card.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => banner.remove(), 250);
}

async function handleCookieAccept() {
    setCookieConsent('accepted');
    setCookie(FILTER_COOKIE, currentFilter, 180);
    await enablePersistenceFromConsent();
    hideCookieBanner();
}

async function handleCookieCustomize() {
    setCookieConsent('personalized');
    setCookie(FILTER_COOKIE, currentFilter, 180);
    await enablePersistenceFromConsent();
    hideCookieBanner();
}

async function handleCookieRefuse() {
    setCookieConsent('refused');
    await clearTasksDB();
    hideCookieBanner();
}

async function enablePersistenceFromConsent() {
    if (!isConsentGranted()) return;
    const dbTasks = await loadTasksFromDB(false);
    const merged = new Map();
    (tasksData || []).forEach(t => merged.set(t.id, t));
    (dbTasks || []).forEach(t => merged.set(t.id, t));
    tasksData = Array.from(merged.values()).sort((a, b) => b.id - a.id);
    await persistTasksToDB();
    renderApp();
}

async function persistTasksToDB() {
    if (!isConsentGranted()) return;
    for (const task of tasksData) {
        await saveTaskToDB(task);
    }
}

async function clearTasksDB() {
    try {
        const db = await dbPromise;
        const tx = db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error('Erreur suppression IndexedDB', err);
    }
}

function applySavedFilter() {
    const saved = getCookie(FILTER_COOKIE);
    if (saved && ['all', 'priority', 'work'].includes(saved)) {
        currentFilter = saved;
    }
}

function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${secure}`;
}

function getCookie(name) {
    if (!document.cookie) return null;
    const parts = document.cookie.split(';');
    for (let part of parts) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const k = part.slice(0, idx).trim();
        const v = part.slice(idx + 1);
        if (k === name) return decodeURIComponent(v || '');
    }
    return null;
}

function deleteCookie(name) {
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${secure}`;
}

// --- INDEXEDDB HELPERS ---
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadTasksFromDB(assign = true) {
    if (!isConsentGranted()) return [];
    try {
        const db = await dbPromise;
        const tasks = await new Promise((resolve, reject) => {
            const tx = db.transaction(DB_STORE, 'readonly');
            const store = tx.objectStore(DB_STORE);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
        if (assign) tasksData = tasks;
        return tasks;
    } catch (err) {
        console.error('Erreur lors du chargement des taches depuis IndexedDB', err);
        return [];
    }
}

function saveTaskToDB(task) {
    if (!isConsentGranted()) return Promise.resolve();
    return dbPromise.then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const req = store.put(task);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    })).catch(err => console.error('Erreur sauvegarde IndexedDB', err));
}

function deleteTaskFromDB(id) {
    if (!isConsentGranted()) return Promise.resolve();
    return dbPromise.then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    })).catch(err => console.error('Erreur suppression IndexedDB', err));
}

// --- FOOTER ---
function setFooterDate() {
    const target = document.getElementById('footer-date');
    if (!target) return;
    const today = new Date();
    target.textContent = today.toLocaleDateString('fr-FR');
}

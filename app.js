/* app.js — простая логика менеджера паролей (localStorage) */

// Ключ в localStorage
const STORAGE_KEY = 'pwa_pw_mgr_v1';

// Элементы
const form = document.getElementById('form');
const loginEl = document.getElementById('login');
const urlEl = document.getElementById('url');
const passEl = document.getElementById('password');
const levelEl = document.getElementById('level');
const lengthEl = document.getElementById('length');
const genBtn = document.getElementById('gen');
const clearBtn = document.getElementById('clear');
const tbody = document.getElementById('tbody');
const table = document.getElementById('table');
const empty = document.getElementById('empty');
const installBtn = document.getElementById('btnInstall');

let editingId = null;
let deferredPrompt = null;

// LocalStorage helpers
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function saveAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// Render
function render() {
  const list = loadAll();
  tbody.innerHTML = '';
  if (!list.length) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  table.style.display = 'table';
  empty.style.display = 'none';

  for (const item of list) {
    const tr = document.createElement('tr');

    const tdLogin = document.createElement('td'); tdLogin.textContent = item.login || '';
    const tdUrl = document.createElement('td'); tdUrl.textContent = item.url || '';
    const tdPass = document.createElement('td');
    const span = document.createElement('span');
    span.textContent = '••••••';
    span.style.cursor = 'pointer';
    span.title = 'Нажмите чтобы показать/скопировать';
    span.addEventListener('click', async () => {
      // Показать пароль временно и копировать
      const wasHidden = span.textContent === '••••••';
      if (wasHidden) {
        span.textContent = item.password;
        try { await navigator.clipboard.writeText(item.password); alert('Пароль скопирован в буфер обмена'); }
        catch(e){ /* silently */ }
        setTimeout(()=>{ span.textContent = '••••••'; }, 3000);
      }
    });
    tdPass.appendChild(span);

    const tdAct = document.createElement('td');
    tdAct.className = 'actions';

    const editBtn = document.createElement('button'); editBtn.textContent = 'Ред.'; editBtn.className='ghost';
    editBtn.addEventListener('click', ()=> startEdit(item.id));

    const copyBtn = document.createElement('button'); copyBtn.textContent = 'Коп.'; copyBtn.addEventListener('click', async ()=> {
      try { await navigator.clipboard.writeText(item.password); alert('Скопировано'); } catch (e) { prompt('Скопируйте пароль вручную', item.password); }
    });

    const delBtn = document.createElement('button'); delBtn.textContent = 'Удал.'; delBtn.addEventListener('click', ()=> {
      if (!confirm('Удалить запись?')) return;
      const updated = loadAll().filter(x => x.id !== item.id);
      saveAll(updated); render();
    });

    tdAct.appendChild(editBtn);
    tdAct.appendChild(copyBtn);
    tdAct.appendChild(delBtn);

    tr.appendChild(tdLogin); tr.appendChild(tdUrl); tr.appendChild(tdPass); tr.appendChild(tdAct);
    tbody.appendChild(tr);
  }
}

// Start editing
function startEdit(id) {
  const item = loadAll().find(x=>x.id===id);
  if (!item) return;
  editingId = id;
  loginEl.value = item.login;
  urlEl.value = item.url;
  passEl.value = item.password;
  window.scrollTo({top:0, behavior:'smooth'});
}

// Clear form
function clearForm() {
  editingId = null;
  form.reset();
}

// Small secure RNG helper
function randomInt(max) {
  const ar = new Uint32Array(1);
  crypto.getRandomValues(ar);
  return ar[0] % max;
}

// Generator — уровень и длина
function generatePassword(level, length) {
  const sets = {
    easy: 'abcdefghijklmnopqrstuvwxyz',
    medium: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    hard: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{};:,.<>?'
  };
  const chars = sets[level] || sets.medium;
  if (!chars.length) return '';
  let out = '';
  for (let i=0;i<length;i++) out += chars[randomInt(chars.length)];
  return out;
}

// Events
genBtn.addEventListener('click', ()=> {
  const lvl = levelEl.value;
  const len = Math.max(4, Math.min(64, Number(lengthEl.value) || 12));
  passEl.value = generatePassword(lvl, len);
});

clearBtn.addEventListener('click', clearForm);

form.addEventListener('submit', (e)=> {
  e.preventDefault();
  const login = loginEl.value.trim();
  const url = urlEl.value.trim();
  const password = passEl.value;
  if (!login || !password) { alert('Заполните логин и пароль'); return; }

  const list = loadAll();
  if (editingId) {
    const idx = list.findIndex(x=>x.id===editingId);
    if (idx>=0) list[idx] = { ...list[idx], login, url, password, updated: Date.now() };
  } else {
    list.push({ id: crypto.randomUUID(), login, url, password, created: Date.now() });
  }
  saveAll(list);
  render();
  clearForm();
});

// PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.classList.remove('hidden');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add('hidden');
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').catch(()=>{});
}

// Init
render();

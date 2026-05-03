// ここが違う！ art.js ではなく rpg.js を読み込む
import { renderRpgStatus } from './rpg.js'; 
import { saveItem, getSavedItems } from './storage.js';

// DOM要素の取得 (art.htmlと共通のID)
const generateBtn = document.getElementById('generate-btn');
const saveBtn = document.getElementById('save-btn');
const shareBtn = document.getElementById('share-btn');
const uuidDisplay = document.getElementById('current-uuid');
const themeBtn = document.getElementById('theme-btn');
const menuBtn = document.getElementById('menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const savedList = document.getElementById('saved-list');
const userInfoArea = document.getElementById('user-info-area');
const displayNickname = document.getElementById('display-nickname');

let currentUuid = "";

// -------------------------------------------------
// 1. 初期化処理
// -------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const sharedUuid = params.get('uuid');
    const sharedName = params.get('name');

    if (sharedUuid) {
        currentUuid = sharedUuid;
        if (sharedName) {
            userInfoArea.style.display = 'inline-flex';
            displayNickname.textContent = sharedName;
        }
    } else {
        currentUuid = crypto.randomUUID();
    }

    updateUI(currentUuid);
    updateSidebarList();
});

// -------------------------------------------------
// 2. 基本機能 (ここが違う！描画ではなくRPGステータス表示)
// -------------------------------------------------
function updateUI(uuid) {
    currentUuid = uuid;
    uuidDisplay.textContent = uuid;
    // アート関数の代わりにこれを呼ぶ
    renderRpgStatus(uuid);
}

generateBtn.addEventListener('click', () => {
    userInfoArea.style.display = 'none';
    const newUuid = crypto.randomUUID();
    updateUI(newUuid);
    window.history.replaceState(null, '', window.location.pathname);
});

// -------------------------------------------------
// 3. 保存機能 (LocalStorage) - 共通ロジック
// -------------------------------------------------
saveBtn.addEventListener('click', () => {
    let name = prompt("このステータスに名前を付けて保存しますか？", currentUuid);
    if (name === null) return;
    if (name.trim() === "") name = currentUuid;
    saveItem(currentUuid, name);
    updateSidebarList();
    alert("保存しました！左上のメニューから確認できます。");
});

function updateSidebarList() {
    const items = getSavedItems();
    savedList.innerHTML = "";
    if (items.length === 0) {
        savedList.innerHTML = '<li class="empty-msg">保存されたデータはありません</li>';
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h4>${escapeHtml(item.name)}</h4>
            <p>${item.uuid}</p>
        `;
        li.addEventListener('click', () => {
            updateUI(item.uuid);
            closeSidebar();
            userInfoArea.style.display = 'inline-flex';
            displayNickname.textContent = item.name;
        });
        savedList.appendChild(li);
    });
}

function escapeHtml(str) {
    if(!str) return "";
    return str.replace(/[<>&"']/g, (match) => {
        const escape = {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'};
        return escape[match];
    });
}

// -------------------------------------------------
// 4. 共有機能 (URL生成) - 共通ロジック
// -------------------------------------------------
shareBtn.addEventListener('click', async () => {
    const nickname = prompt("プレイヤー名を入力してください", "Guest");
    if (nickname === null) return;
    const url = new URL(window.location.href);
    url.searchParams.set('uuid', currentUuid);
    url.searchParams.set('name', nickname);
    try {
        await navigator.clipboard.writeText(url.toString());
        alert("共有リンクをコピーしました！\n" + url.toString());
    } catch (err) {
        prompt("以下のリンクをコピーしてください", url.toString());
    }
});

// -------------------------------------------------
// 5. UI操作 (サイドバー・テーマ) - 共通ロジック
// -------------------------------------------------
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});
const closeSidebar = () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
};
closeMenuBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = themeBtn.querySelector('span');
    if (document.body.classList.contains('dark-theme')) {
        icon.textContent = 'light_mode';
    } else {
        icon.textContent = 'dark_mode';
    }
});
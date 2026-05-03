import { drawArt } from './art.js';
import { saveItem, getSavedItems } from './storage.js';

// DOM要素の取得
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
    // URLパラメータを確認 (?uuid=...&name=...)
    const params = new URLSearchParams(window.location.search);
    const sharedUuid = params.get('uuid');
    const sharedName = params.get('name');

    if (sharedUuid) {
        // 共有リンクから来た場合
        currentUuid = sharedUuid;
        if (sharedName) {
            userInfoArea.style.display = 'inline-flex';
            displayNickname.textContent = sharedName;
        }
    } else {
        // 通常アクセスの場合は新規生成
        currentUuid = crypto.randomUUID();
    }

    updateUI(currentUuid);
    updateSidebarList();
});

// -------------------------------------------------
// 2. 基本機能 (生成・描画)
// -------------------------------------------------
function updateUI(uuid) {
    currentUuid = uuid;
    uuidDisplay.textContent = uuid;
    drawArt(uuid);
}

generateBtn.addEventListener('click', () => {
    // 新規生成時はニックネーム表示を消す
    userInfoArea.style.display = 'none';
    const newUuid = crypto.randomUUID();
    updateUI(newUuid);
    
    // URLも綺麗にする（パラメータを消す）
    window.history.replaceState(null, '', window.location.pathname);
});

// -------------------------------------------------
// 3. 保存機能 (LocalStorage)
// -------------------------------------------------
saveBtn.addEventListener('click', () => {
    // 名前を入力させる
    let name = prompt("このアートに名前を付けて保存しますか？", currentUuid);
    
    // キャンセルされたらnullが返るので何もしない
    if (name === null) return;
    
    // 空欄ならUUIDを名前にする
    if (name.trim() === "") name = currentUuid;

    saveItem(currentUuid, name);
    updateSidebarList();
    alert("保存しました！左上のメニューから確認できます。");
});

function updateSidebarList() {
    const items = getSavedItems();
    savedList.innerHTML = "";

    if (items.length === 0) {
        savedList.innerHTML = '<li class="empty-msg">保存されたアートはありません</li>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <h4>${escapeHtml(item.name)}</h4>
            <p>${item.uuid}</p>
        `;
        // クリックしたらそのUUIDを読み込む
        li.addEventListener('click', () => {
            updateUI(item.uuid);
            // スマホ向けにメニューを閉じる
            closeSidebar();
            // 名前も表示してあげる（保存した名前）
            userInfoArea.style.display = 'inline-flex';
            displayNickname.textContent = item.name;
        });
        savedList.appendChild(li);
    });
}

// XSS対策用エスケープ関数
function escapeHtml(str) {
    if(!str) return "";
    return str.replace(/[<>&"']/g, (match) => {
        const escape = {
            '<': '&lt;',
            '>': '&gt;',
            '&': '&amp;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}

// -------------------------------------------------
// 4. 共有機能 (URL生成)
// -------------------------------------------------
shareBtn.addEventListener('click', async () => {
    const nickname = prompt("共有用のニックネームを入力してください", "Guest");
    if (nickname === null) return;

    // 現在のURLを取得し、パラメータを付与
    const url = new URL(window.location.href);
    url.searchParams.set('uuid', currentUuid);
    url.searchParams.set('name', nickname);

    try {
        await navigator.clipboard.writeText(url.toString());
        alert("共有リンクをコピーしました！\n友達に送ってみよう！\n\n" + url.toString());
    } catch (err) {
        prompt("以下のリンクをコピーしてください", url.toString());
    }
});

// -------------------------------------------------
// 5. UI操作 (サイドバー・テーマ)
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

// テーマ切り替え
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    
    // アイコン切り替え
    const icon = themeBtn.querySelector('span');
    if (document.body.classList.contains('dark-theme')) {
        icon.textContent = 'light_mode';
    } else {
        icon.textContent = 'dark_mode';
    }
});
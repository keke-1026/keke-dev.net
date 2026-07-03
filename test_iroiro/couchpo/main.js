import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp({
  apiKey: "AIzaSyBss3X4TU521AXPLgWSA_lB6Un1yhO4oRg",
  authDomain: "couchpotato-hp.firebaseapp.com",
  projectId: "couchpotato-hp"
});
const db = getFirestore(app);

// スクロールトップボタンの生成と制御
function setupScrollToTop() {
    const btn = document.createElement("button");
    btn.id = "scroll-to-top";
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 4l-8 8h6v8h4v-8h6z"/></svg>`;
    document.body.appendChild(btn);

    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) btn.classList.add("show");
        else btn.classList.remove("show");
    });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

async function applySiteSettings() {
    try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) {
            const data = snap.data();
            if (data.favicon) {
                let link = document.querySelector("link[rel~='icon']");
                if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
                link.href = data.favicon;
            }
            if (data.topImage) {
                const topImageEl = document.getElementById("site-top-image");
                if (topImageEl) topImageEl.style.backgroundImage = `url(${data.topImage})`;
            }
            if (data.headerLogo) {
                const logoImg = document.getElementById("header-logo-img");
                if (logoImg) {
                    logoImg.src = data.headerLogo;
                    logoImg.style.maxHeight = "60px";
                }
            }
        }
    } catch (e) { console.error("設定取得エラー:", e); }
}

const youtubeSvg = `<svg viewBox="0 0 24 24"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/></svg>`;
function parseYouTube(input) {
    const vidMatch = input.match(/(?:youtu\.be\/|watch\?v=|\&v=)([^#\&\?]*)/);
    if (vidMatch && vidMatch[1].length === 11) return { type: 'embed', id: vidMatch[1] };
    let id = input.startsWith('@') ? input : '@' + input;
    return { type: 'channel', url: `https://www.youtube.com/${id}` };
}

const xSvg = `<svg viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>`;
function parseTwitter(input) {
    const postMatch = input.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
    if (postMatch) return { type: 'embed', url: input };
    let id = input.startsWith('@') ? input.substring(1) : input;
    return { type: 'profile', url: `https://x.com/${id}` };
}

// 記事ブロックをHTMLに変換する共通関数
function renderBlocks(blocks) {
    let html = '';
    let hasTwitterEmbed = false;
    if (!blocks) return { html, hasTwitterEmbed };

    blocks.forEach(block => {
        html += `<div style="margin-bottom: 30px;">`;
        if (block.type === 'text') {
            html += `<p style="line-height: 1.8;">${block.content.replace(/\n/g, "<br>")}</p>`;
        } else if (block.type === 'image') {
            html += `<img src="${block.url}" style="max-width:100%; border-radius:4px;">`;
        } else if (block.type === 'youtube') {
            const yt = parseYouTube(block.url);
            if (yt.type === 'embed') {
                html += `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${yt.id}" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe>`;
            } else {
                html += `<a href="${yt.url}" target="_blank" class="sns-btn">${youtubeSvg} YouTubeを見る</a>`;
            }
        } else if (block.type === 'twitter') {
            const tw = parseTwitter(block.url);
            if (tw.type === 'embed') {
                hasTwitterEmbed = true;
                html += `<blockquote class="twitter-tweet" data-theme="light"><a href="${tw.url}"></a></blockquote>`;
            } else {
                html += `<a href="${tw.url}" target="_blank" class="sns-btn">${xSvg} X (Twitter)を見る</a>`;
            }
        }
        html += `</div>`;
    });
    return { html, hasTwitterEmbed };
}

document.addEventListener("DOMContentLoaded", () => {
    applySiteSettings();
    setupScrollToTop();

    const newsContainer = document.getElementById("news-container");
    const liveContainer = document.getElementById("live-container");
    const postContainer = document.getElementById("post-container");
    const searchContainer = document.getElementById("search-container");

    // === 1. トップページ (News一覧) ===
    if (newsContainer) {
        async function fetchNewsList() {
            const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const filteredDocs = snapshot.docs.filter(d => {
                const cats = d.data().categories || [];
                return cats.includes("news") || cats.length === 0; // 昔のデータも表示
            });

            newsContainer.innerHTML = filteredDocs.length === 0 ? "<p>お知らせはありません。</p>" : "";
            filteredDocs.forEach((docSnap) => {
                const data = docSnap.data();
                const linkUrl = `post.html?id=${docSnap.id}`;
                newsContainer.insertAdjacentHTML('beforeend', `
                    <article class="blog-list__item blog-item u-bdr-clr">
                        <div class="blog-item__inner">
                            <a class="blog-item__date u-acnt-bg-clr u-font" href="${linkUrl}"><time>${data.date}</time></a>
                            <p class="blog-item__text"><a class="u-txt-clr" href="${linkUrl}">${data.title}</a></p>
                        </div>
                    </article>
                `);
            });
        }
        fetchNewsList();
    }

    // === 2. ライブページ (Live一覧: 中身をフル展開) ===
    if (liveContainer) {
        async function fetchLiveList() {
            const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            const filteredDocs = snapshot.docs.filter(d => (d.data().categories || []).includes("live"));

            liveContainer.innerHTML = filteredDocs.length === 0 ? "<p>ライブの予定はまだありません。</p>" : "";
            let loadTwitterWidget = false;

            filteredDocs.forEach((docSnap) => {
                const data = docSnap.data();
                const rendered = renderBlocks(data.blocks);
                if (rendered.hasTwitterEmbed) loadTwitterWidget = true;

                liveContainer.insertAdjacentHTML('beforeend', `
                    <article class="blog-item--index0 blog-list__item blog-item u-bdr-clr" style="margin-bottom: 60px; padding-bottom: 40px;">
                        <div class="blog-item__inner">
                            <div class="blog-item__header">
                                <a class="blog-item__date u-acnt-bg-clr u-font" href="post.html?id=${docSnap.id}"><time>${data.date}</time></a>
                            </div>
                            <div class="blog-item__content">
                                <div class="blog-item__title blog-title">
                                    <h1 class="blog-title__text"><a class="u-txt-clr" href="post.html?id=${docSnap.id}">${data.title}</a></h1>
                                </div>
                                <div class="blog-item__body blog-body blog-body--show-title" style="margin-top: 20px;">
                                    ${rendered.html}
                                </div>
                            </div>
                        </div>
                    </article>
                `);
            });

            if (loadTwitterWidget) {
                const script = document.createElement("script");
                script.src = "https://platform.twitter.com/widgets.js";
                script.async = true; script.charset = "utf-8";
                document.body.appendChild(script);
            }
        }
        fetchLiveList();
    }

    // === 3. 個別記事ページ ===
    if (postContainer) {
        async function fetchPost() {
            const postId = new URLSearchParams(window.location.search).get('id');
            if (!postId) return;

            const docSnap = await getDoc(doc(db, "news", postId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById("page-title").textContent = `${data.title} | カウチポテト`;
                document.getElementById("post-title").textContent = data.title;
                document.getElementById("post-date").textContent = data.date;
                
                const contentArea = document.getElementById("post-content");
                const rendered = renderBlocks(data.blocks);
                contentArea.innerHTML = rendered.html || `<p>${(data.content||"").replace(/\n/g, "<br>")}</p>`;

                if (rendered.hasTwitterEmbed) {
                    const script = document.createElement("script");
                    script.src = "https://platform.twitter.com/widgets.js";
                    script.async = true; script.charset = "utf-8";
                    document.body.appendChild(script);
                }

                if (data.tags && data.tags.length > 0) {
                    let tagsHtml = '<div style="margin-top: 30px;">';
                    data.tags.forEach(tag => { tagsHtml += `<a href="search.html?tagsearch=${encodeURIComponent(tag)}" style="display:inline-block; padding:8px 12px; margin-right:10px; margin-bottom:10px; border:1px solid #cdc5b4; border-radius:30px; text-decoration:none;" class="u-txt-clr"># ${tag}</a>`; });
                    contentArea.insertAdjacentHTML('beforeend', tagsHtml + '</div>');
                    
                    const allDocs = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));
                    const related = allDocs.docs.filter(d => d.id !== postId && (d.data().tags || []).includes(data.tags[0])).slice(0, 4);
                    
                    if (related.length > 0) {
                        let relatedHtml = '<div style="margin-top: 60px; border-top: 1px solid #cdc5b4; padding-top: 30px;"><h3 class="u-ttl-blk-clr">関連記事</h3><ul style="list-style:none; padding-left:0; line-height:1.8;">';
                        related.forEach(rDoc => { relatedHtml += `<li><a href="post.html?id=${rDoc.id}" class="u-lnk-clr" style="text-decoration:none;">・ ${rDoc.data().title}</a></li>`; });
                        contentArea.insertAdjacentHTML('beforeend', relatedHtml + '</ul></div>');
                    }
                }
            }
        }
        fetchPost();
    }

    // === 4. 検索ページ ===
    if (searchContainer) {
        async function performSearch() {
            const urlParams = new URLSearchParams(window.location.search);
            const tagQuery = urlParams.get('tagsearch');
            const textQuery = urlParams.get('search');
            const titleLabel = document.getElementById("search-title");
            searchContainer.innerHTML = "";

            const snap = await getDocs(query(collection(db, "news"), orderBy("createdAt", "desc")));

            if (tagQuery) {
                titleLabel.textContent = `タグ: #${tagQuery}`;
                const filtered = snap.docs.filter(d => (d.data().tags || []).includes(tagQuery));
                displaySearch(filtered);
            } else if (textQuery) {
                titleLabel.textContent = `検索: ${textQuery}`;
                const filtered = snap.docs.filter(d => (d.data().title || "").includes(textQuery));
                displaySearch(filtered);
            } else {
                searchContainer.innerHTML = "<p>キーワードが指定されていません。</p>";
            }
        }
        function displaySearch(docs) {
            if (docs.length === 0) { searchContainer.innerHTML = "<p>見つかりませんでした。</p>"; return; }
            docs.forEach(docSnap => {
                const data = docSnap.data();
                const link = `post.html?id=${docSnap.id}`;
                searchContainer.insertAdjacentHTML('beforeend', `
                    <article class="blog-list__item blog-item u-bdr-clr"><div class="blog-item__inner">
                    <a class="blog-item__date u-acnt-bg-clr u-font" href="${link}"><time>${data.date}</time></a>
                    <p class="blog-item__text"><a class="u-txt-clr" href="${link}">${data.title}</a></p>
                    </div></article>
                `);
            });
        }
        performSearch();
    }
});
window.addEventListener('load', () => {
  // ページ内のテキストノードを走査して「67」をspanタグに置換
  wrapSixtySeven(document.body);

  // 監視対象（マークアップした67）の要素をすべて取得
  const triggers = document.querySelectorAll('.sixtyseven-trigger');
  
  if (triggers.length > 0) {
    setupObserver(triggers);
  }
});

// テキストノードを安全に置換する関数
function wrapSixtySeven(element) {
  const nodes = element.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    
    // スクリプトやスタイル、入力エリアなどのタグは除外
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.nodeName === 'TEXTAREA' || node.nodeName === 'INPUT') {
      continue;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (text.includes('67')) {
        const span = document.createElement('span');
        // 該当するすべての「67」をクラス付きのspanで囲む
        span.innerHTML = text.replace(/67/g, '<span class="sixtyseven-trigger">67</span>');
        node.parentNode.replaceChild(span, node);
      }
    } else {
      wrapSixtySeven(node);
    }
  }
}

// 画面内への進入を監視する設定
function setupObserver(elements) {
  const options = {
    root: null, // ビューポートを基準にする
    rootMargin: '0px',
    threshold: 0.5 // 要素が50%以上画面に入ったら発動
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        
        // ギミックを発動
        triggerEffect(target);
        
        // 一度発動した要素は監視を解除する
        observer.unobserve(target);
      }
    });
  }, options);

  elements.forEach(el => observer.observe(el));
}

function triggerEffect(targetElement) {
  // 1. 対象の「67」に下線を引く（CSSで定義したactiveクラスを付与）
  targetElement.classList.add('active');

  // 2. 音声の再生
  const audioUrl = chrome.runtime.getURL("sound.mp3");
  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.log("Auto-play blocked by browser.");
  });

  // 3. オーバーレイ要素の作成
  const overlay = document.createElement('div');
  overlay.id = 'sixtyseven-overlay';

  // 4. メディア要素の作成（デフォルトは画像。動画にする場合はコメントを切り替えてください）
  const media = document.createElement('img');
  media.src = chrome.runtime.getURL("67kids.png");
  
  /* // 動画（mp4）を使用する場合は、上の2行を消して以下のコメントアウトを解除してください
  const media = document.createElement('video');
  media.src = chrome.runtime.getURL("67kids.mp4");
  media.autoplay = true;
  media.muted = true;
  media.loop = false;
  */

  media.id = 'sixtyseven-media';

  overlay.appendChild(media);
  document.body.appendChild(overlay);

  // 5. フェードイン・フェードアウトの制御
  setTimeout(() => {
    // 表示（フェードイン）
    overlay.style.opacity = '1';
    
    // 2秒後にフェードアウトを開始
    setTimeout(() => {
      overlay.style.opacity = '0';
      
      // フェードアウトの完了（3秒）を待ってからDOMから削除
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.remove();
        }
      }, 3000);
      
    }, 2000); 
  }, 100);
}
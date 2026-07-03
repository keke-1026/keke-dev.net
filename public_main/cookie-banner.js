(function() {
  const consentKey = 'cookie_consent_accepted';
  const sessionLoggedKey = 'access_logged_this_session';

  // WorkersのログエンドポイントへIPとUser-Agentの記録をリクエストする関数
  function logAccess() {
    if (sessionStorage.getItem(sessionLoggedKey)) return;

    fetch('/api/log-access', { method: 'POST' })
      .then(() => {
        sessionStorage.setItem(sessionLoggedKey, 'true');
      })
      .catch(err => console.error('Log request failed:', err));
  }

  // すでに同意済みであれば、バナーは出さずにログ記録処理だけ行って終了
  if (localStorage.getItem(consentKey)) {
    logAccess();
    return;
  }

  // Google Fonts (Noto Sans JP) の動的読み込み
  if (!document.getElementById('font-noto-sans')) {
    const link = document.createElement('link');
    link.id = 'font-noto-sans';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  // バナー外枠の作成 (白ベース、固定配置)
  const banner = document.createElement('div');
  banner.style.position = 'fixed';
  banner.style.bottom = '20px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.width = 'calc(100% - 40px)';
  banner.style.maxWidth = '600px';
  banner.style.backgroundColor = '#ffffff';
  banner.style.color = '#333333';
  banner.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
  banner.style.borderRadius = '8px';
  banner.style.padding = '16px';
  banner.style.display = 'flex';
  banner.style.flexDirection = 'column';
  banner.style.gap = '12px';
  banner.style.zIndex = '999999';
  banner.style.fontFamily = "'Noto Sans JP', sans-serif";
  banner.style.border = '1px solid #e0e0e0';

  // コンテンツ配置用コンテナ
  const contentArea = document.createElement('div');
  contentArea.style.display = 'flex';
  contentArea.style.alignItems = 'flex-start';
  contentArea.style.gap = '12px';

  // SVG クッキー風アイコン
  const iconWrapper = document.createElement('div');
  iconWrapper.style.flexShrink = '0';
  iconWrapper.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#666666">
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm4.5-11a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 16.5 9zm-9 3a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 7.5 12zm5-4a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 12.5 8zm-2 7a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 10.5 15zm4 1a1.5 1.5 0 1 1-1.5 1.5A1.5 1.5 0 0 1 14.5 16z"/>
    </svg>
  `;

  // テキスト文言
  const text = document.createElement('p');
  text.innerText = '当サイトでは、アクセス解析およびセキュリティ向上のため、Cookieを使用した端末識別およびIPアドレスの記録を行っています。この処理に同意いただける場合は「同意する」を押してください。';
  text.style.margin = '0';
  text.style.fontSize = '13px';
  text.style.lineHeight = '1.6';
  text.style.color = '#555555';

  contentArea.appendChild(iconWrapper);
  contentArea.appendChild(text);

  // ボタンエリア
  const buttonArea = document.createElement('div');
  buttonArea.style.display = 'flex';
  buttonArea.style.justifyContent = 'flex-end';

  // 同意ボタン
  const button = document.createElement('button');
  button.innerText = '同意する';
  button.style.backgroundColor = '#333333';
  button.style.color = '#ffffff';
  button.style.border = 'none';
  button.style.padding = '8px 24px';
  button.style.borderRadius = '4px';
  button.style.fontSize = '13px';
  button.style.fontWeight = '700';
  button.style.cursor = 'pointer';
  button.style.fontFamily = "'Noto Sans JP', sans-serif";
  button.style.transition = 'background-color 0.2s';

  button.onmouseover = () => { button.style.backgroundColor = '#555555'; };
  button.onmouseout = () => { button.style.backgroundColor = '#333333'; };

  // ボタンクリック時のイベント
  button.addEventListener('click', () => {
    localStorage.setItem(consentKey, 'true');
    banner.remove();
    logAccess();
  });

  buttonArea.appendChild(button);
  banner.appendChild(contentArea);
  banner.appendChild(buttonArea);

  // DOMへの挿入
  if (document.body) {
    document.body.appendChild(banner);
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(banner);
    });
  }
})();
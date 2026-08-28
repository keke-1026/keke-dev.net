const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
document.head.appendChild(link);

let isFullscreen = false;

function toggleFullscreen() {
  const player = document.getElementById('movie_player');
  const btnIcon = document.querySelector('#custom-fullscreen-btn .material-symbols-outlined');

  if (!player || !btnIcon) return;

  if (!isFullscreen) {
    player.classList.add('custom-browser-fullscreen');
    document.body.classList.add('custom-fullscreen-body-lock');
    btnIcon.textContent = 'fullscreen_exit';
  } else {
    player.classList.remove('custom-browser-fullscreen');
    document.body.classList.remove('custom-fullscreen-body-lock');
    btnIcon.textContent = 'fullscreen';
  }
  
  isFullscreen = !isFullscreen;
  window.dispatchEvent(new Event('resize'));
}

function insertButton() {
  if (document.getElementById('custom-fullscreen-btn')) return;

  const rightControls = document.querySelector('.ytp-right-controls');
  if (!rightControls) return;

  const btn = document.createElement('button');
  btn.id = 'custom-fullscreen-btn';
  btn.className = 'ytp-button';
  btn.setAttribute('title', 'ブラウザ内フルスクリーン');
  btn.innerHTML = '<span class="material-symbols-outlined">fullscreen</span>';
  btn.addEventListener('click', toggleFullscreen);

  const fullScreenBtn = rightControls.querySelector('.ytp-fullscreen-button');
  if (fullScreenBtn) {
    rightControls.insertBefore(btn, fullScreenBtn);
  } else {
    rightControls.appendChild(btn);
  }
}

const observer = new MutationObserver(() => {
  insertButton();
});

observer.observe(document.body, { childList: true, subtree: true });
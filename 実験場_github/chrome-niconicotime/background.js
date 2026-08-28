// --- 設定：毎日何時に流すか (HH:mm形式) ---
const DAILY_PLAY_TIME = "00:00"; 

chrome.runtime.onInstalled.addListener(() => setupDailyAlarm());
chrome.runtime.onStartup.addListener(() => setupDailyAlarm());

function setupDailyAlarm() {
  chrome.alarms.clear('dailyVideoAlarm');

  const [hours, minutes] = DAILY_PLAY_TIME.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  // 指定時間が既に過ぎている場合は明日のその時間に設定
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  chrome.alarms.create('dailyVideoAlarm', {
    when: target.getTime(),
    periodInMinutes: 1440 // 24時間ごとに繰り返す
  });

  console.log(`アラーム設定完了: 毎日 ${DAILY_PLAY_TIME} に実行されます。`);
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyVideoAlarm') {
    playVideoInActiveTab();
  }
});

function playVideoInActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    
    const targetTab = tabs[0];

    // Chromeのシステムページなどにはスクリプトを注入できないためスキップ
    if (targetTab.url && (targetTab.url.startsWith('chrome://') || targetTab.url.startsWith('chrome-extension://') || targetTab.url.startsWith('edge://') || targetTab.url.startsWith('about:'))) {
      console.warn("システムページには動画を流せません:", targetTab.url);
      return; 
    }
    
    // スクリプトの注入を実行
    chrome.scripting.executeScript({
      target: { tabId: targetTab.id },
      func: injectTabFullscreenVideo,
      args: [chrome.runtime.getURL('sample.mp4')]
    }).catch((err) => {
      console.error("スクリプト注入エラー:", err);
    });
  });
}

// --- 以下の関数は現在開いているWebページの文脈で実行されます ---
function injectTabFullscreenVideo(videoUrl) {
  // 既に動画が存在している場合は重複実行を防ぐ
  if (document.getElementById('daily-video-overlay')) return;

  const video = document.createElement('video');
  video.id = 'daily-video-overlay';
  video.src = videoUrl;
  
  // タブ内を真っ黒にして埋め尽くす擬似フルスクリーンCSS
  Object.assign(video.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    objectFit: 'contain',
    zIndex: '2147483647', // 最前面に表示
    backgroundColor: 'black'
  });

  document.body.appendChild(video);

  // 再生処理
  const startVideo = async () => {
    try {
      // 最初は音声ありで再生を試みる
      await video.play();
    } catch (e) {
      console.warn("音声ありでの再生に失敗しました。ミュートで再試行します。");
      // 自動再生ポリシーに引っかかった場合はミュートにして再試行
      video.muted = true;
      try {
        await video.play();
      } catch (muteErr) {
        console.error("ミュートでの再生にも失敗しました:", muteErr);
      }
    }
  };

  startVideo();

  // 再生が終了したら要素を削除して元の画面に戻す
  video.addEventListener('ended', () => {
    video.remove();
  });
}
// UUIDを元にアートを描画する関数
export function drawArt(uuid) {
    const canvas = document.getElementById('art-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // UUIDのハイフンを除去して扱いやすくする
    const cleanUuid = uuid.replace(/-/g, '');
    
    // ヘルパー関数: 文字列から数値を取り出す
    const getVal = (index) => parseInt(cleanUuid.substring(index*2, index*2+2), 16) || 0;

    // 背景色 (最初の3バイト)
    const r = getVal(0);
    const g = getVal(1);
    const b = getVal(2);
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, width, height);

    // 模様を描画 (残りのデータを使用)
    // デザインを少しリッチに：半透明の円を重ねる
    for (let i = 3; i < 16; i++) {
        const val = getVal(i);
        
        // 座標とサイズ
        const x = (val * 31) % width;
        const y = (val * 17) % height;
        const radius = (val % 80) + 20; // 20px〜100px

        // 色相をUUIDに基づいて少しずらす
        const hue = (r + val) % 360;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 半透明の白または色付き
        if (i % 2 === 0) {
            ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.5)`;
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        }
        
        ctx.fill();
        
        // 枠線をつけるとおしゃれ
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
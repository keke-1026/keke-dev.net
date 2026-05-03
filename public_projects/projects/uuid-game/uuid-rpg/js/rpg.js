// ヘルパー関数: UUIDの特定部分を0-255の数値にする
const getVal = (cleanUuid, index) => parseInt(cleanUuid.substring(index*2, index*2+2), 16) || 0;

// メイン関数: ステータスを計算して表示する
export function renderRpgStatus(uuid) {
    const resultArea = document.getElementById('rpg-result-area');
    if (!resultArea) return;

    const cleanUuid = uuid.replace(/-/g, '');

    // --- 1. 職業決定 (先頭の1文字) ---
    const firstChar = cleanUuid[0];
    let job = "Novice";
    if (/[0-3]/.test(firstChar)) job = "Warrior";
    else if (/[4-7]/.test(firstChar)) job = "Mage";
    else if (/[8-b]/.test(firstChar)) job = "Ranger";
    else if (/[c-e]/.test(firstChar)) job = "Paladin";
    else job = "Necromancer"; // 'f'の場合

    // --- 2. レア度決定 ( 'f' や '0' の数で判定してみる) ---
    const matchCount = (cleanUuid.match(/[f0]/g) || []).length;
    let rank = "N";
    if (matchCount >= 8) rank = "SSR";
    else if (matchCount >= 5) rank = "SR";
    else if (matchCount >= 3) rank = "R";

    // --- 3. パラメータ計算 (特定のバイト値を使う) ---
    // 0-255の値を、それっぽいステータス値(例えば10-99)に変換
    const toStat = (val) => Math.floor((val / 255) * 89) + 10;
    
    const stats = {
        STR: toStat(getVal(cleanUuid, 1)),
        INT: toStat(getVal(cleanUuid, 2)),
        AGI: toStat(getVal(cleanUuid, 3)),
        VIT: toStat(getVal(cleanUuid, 4)),
        LUK: toStat(getVal(cleanUuid, 15)) // 最後の値は運
    };

    // --- 4. HTML生成 ---
    resultArea.innerHTML = `
        <div><span class="rank-badge rank-${rank}">${rank}</span></div>
        <h2 class="job-title">${job}</h2>
        
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-label">STR (筋力)</span>
                <span class="stat-value">${stats.STR}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">INT (知力)</span>
                <span class="stat-value">${stats.INT}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">AGI (素早さ)</span>
                <span class="stat-value">${stats.AGI}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">VIT (体力)</span>
                <span class="stat-value">${stats.VIT}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">LUK (運)</span>
                <span class="stat-value">${stats.LUK}</span>
            </div>
        </div>
    `;
}
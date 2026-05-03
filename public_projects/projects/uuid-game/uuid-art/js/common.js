// URLのクエリパラメータ(?uuid=...)からUUIDを取得する関数
export function getUuidFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    let uuid = urlParams.get('uuid');

    // もしURLにUUIDが無かったら、仮のものを入れておく（エラー防止）
    if (!uuid) {
        console.warn("URLにUUID指定がありません。テスト用のUUIDを使用します。");
        uuid = "test-uuid-0000-0000-0000-000000000000"; // 全部ゼロだと黒くなる
    }
    return uuid;
}

// (前のutils.jsにあったやつ) UUIDの特定部分を数値化する関数
export function getByteFromUUID(uuid, index) {
    // テスト用文字列などが来た時のための安全策
    try {
        const cleanUuid = uuid.replace(/-/g, '');
        // 16進数じゃない文字が含まれてたら0にする
        const hex = cleanUuid.substring(index * 2, index * 2 + 2);
        if (!/^[0-9a-fA-F]+$/.test(hex)) return 0; 
        return parseInt(hex, 16) || 0;
    } catch (e) {
        return 0;
    }
}
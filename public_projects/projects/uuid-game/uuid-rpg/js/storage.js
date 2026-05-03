const STORAGE_KEY = 'uuid_art_saved';

// 保存されているリストを取得
export function getSavedItems() {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
}

// 新しく保存する
export function saveItem(uuid, name) {
    const items = getSavedItems();
    
    // 新しいアイテムを作成
    const newItem = {
        id: crypto.randomUUID(), // 管理用ID
        uuid: uuid,
        name: name || uuid, // 名前がなければUUIDを名前にする
        date: new Date().toLocaleString()
    };

    // 配列の先頭に追加
    items.unshift(newItem);
    
    // 保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return items;
}
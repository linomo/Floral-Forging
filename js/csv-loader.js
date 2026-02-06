/**
 * CSVLoader - 載入所有遊戲資料
 * 存放路徑：js/core/csv-loader.js
 */
const CSVLoader = {
    data: {
        characters: [], avatars: [], grades: [], physical: [],
        mental: [], weapons: [], metal: [], wood: [],
        comments: [], luckRandom: [], books: [],
        forgeMap: [], modalEpCost: []  // 🔧 新增
    },

    async loadCSV(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`找不到檔案: ${path}`);
            const text = await response.text();
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            
            return lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => {
                    obj[h] = values[i] ? values[i].trim() : '';
                });
                return obj;
            });
        } catch (e) {
            console.error('❌ CSV 載入失敗:', e);
            return [];
        }
    },

    async loadAll() {
        console.log('📦 開始載入遊戲資料庫...');
        
        // 1. 角色類 (chara 資料夾)
        this.data.characters = await this.loadCSV('data/chara/chara.csv');
        this.data.avatars = await this.loadCSV('data/chara/PC_avatars.csv');
        
        // 2. 物品類 (items 資料夾)
        this.data.weapons = await this.loadCSV('data/items/weapon.csv');
        this.data.books = await this.loadCSV('data/items/book.csv');
        this.data.metal = await this.loadCSV('data/items/metal.csv');
        this.data.wood = await this.loadCSV('data/items/wood.csv');
        
        // 3. 鍛造規則 (forging 資料夾)
        this.data.grades = await this.loadCSV('data/forging/prefixes_grade.csv');
        this.data.physical = await this.loadCSV('data/forging/prefixes_physical.csv');
        this.data.mental = await this.loadCSV('data/forging/prefixes_mental.csv');
        this.data.comments = await this.loadCSV('data/forging/grade_comment.csv');
        this.data.modalEpCost = await this.loadCSV('data/forging/modal_ep_cost.csv');  // 🔧 新增
        
        // 4. 地圖 (map 資料夾)
        this.data.forgeMap = await this.loadCSV('data/map/forge_map.csv');  // 🔧 新增
        
        // 5. 機率表 (根目錄)
        this.data.luckRandom = await this.loadCSV('data/luck_random.csv');
        
        console.log('✅ 資料庫載入完畢', this.data);
        return true;
    },

    getCharacter(charaId) {
        return this.data.characters.find(c => c.chara_id === charaId);
    },
    
    // 🔧 新增：取得房間物件資料
    getForgeObject(objId) {
        return this.data.forgeMap.find(obj => obj.obj_id === objId);
    },
    
    // 🔧 新增：取得 modal 的 EP 消耗
    getModalEpCost(modalId, actionName) {
        const entry = this.data.modalEpCost.find(
            e => e.modal_id === modalId && e.action_name === actionName
        );
        return entry ? parseInt(entry.ep_cost) : 0;
    }
};

window.CSVLoader = CSVLoader;

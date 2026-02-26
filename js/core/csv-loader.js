/**
 * CSVLoader - 載入所有遊戲資料
 * js/core/csv-loader.js
 */
const CSVLoader = {
    data: {
        characters: [], avatars: [],
        grades: [], physical: [], mental: [],
        weapons: [], metal: [], wood: [],
        comments: [], luckRandom: [], books: [],
        forgeMap: [], bedroomMap: [], modalEpCost: [],
        commissions: [],
        furniture: [],
        equipment: [],
        actions: []
    },

    async loadCSV(path) {
        try {
            const res = await fetch(`${path}?t=${Date.now()}`);
            if (!res.ok) throw new Error(`找不到檔案: ${path}`);
            const text = await res.text();
            const lines = text.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            return lines.slice(1).map(line => {
                const values = line.split(',');
                const obj = {};
                headers.forEach((h, i) => { obj[h] = values[i] ? values[i].trim() : ''; });
                return obj;
            });
        } catch (e) {
            console.error('❌ CSV 載入失敗:', e);
            return [];
        }
    },

    async loadAll() {
        console.log('📦 開始載入遊戲資料庫...');

        // 角色
        this.data.characters  = await this.loadCSV('data/characters.csv');
        this.data.avatars     = [];  // 頭像系統待開發

        // 物品
        this.data.weapons   = await this.loadCSV('data/items/weapon.csv');
        this.data.books     = await this.loadCSV('data/items/book.csv');
        this.data.metal     = await this.loadCSV('data/items/metal.csv');
        this.data.wood      = await this.loadCSV('data/items/wood.csv');
        this.data.furniture = await this.loadCSV('data/items/furniture.csv');
        this.data.equipment = await this.loadCSV('data/items/equipment.csv');

        // 鍛造規則
        this.data.grades   = await this.loadCSV('data/forging/prefixes_grade.csv');
        this.data.physical = await this.loadCSV('data/forging/prefixes_physical.csv');
        this.data.mental   = await this.loadCSV('data/forging/prefixes_mental.csv');
        this.data.comments = await this.loadCSV('data/forging/grade_comments.csv');
        this.data.modalEpCost = await this.loadCSV('data/forging/modal_ep_cost.csv');

        // 委託
        this.data.commissions = await this.loadCSV('data/forging/commission.csv');

        // 地圖
        this.data.forgeMap   = await this.loadCSV('data/map/forge_map.csv');
        this.data.bedroomMap = await this.loadCSV('data/map/bedroom_map.csv');

        // 機率表
        this.data.luckRandom = await this.loadCSV('data/luck_random.csv');

        // 排程
        this.data.actions = await this.loadCSV('data/schedule/actions.csv');

        console.log('✅ 資料庫載入完畢', this.data);
        return true;
    },

    // === 查詢輔助 ===
    getCharacter(charaId) {
        return this.data.characters.find(c => c.chara_id === charaId);
    },

    getForgeObject(objId) {
        return this.data.forgeMap.find(o => o.obj_id === objId);
    },

    getBedroomObject(objId) {
        return this.data.bedroomMap.find(o => o.obj_id === objId);
    },

    getModalEpCost(modalId, actionName) {
        const entry = this.data.modalEpCost.find(
            e => e.modal_id === modalId && e.action_name === actionName
        );
        return entry ? parseInt(entry.ep_cost) : 0;
    },

    getCommission(commissionId) {
        return this.data.commissions.find(c => c.commission_id === commissionId);
    },

    getFurniture(furnitureId) {
        return this.data.furniture.find(f => f.furniture_id === furnitureId);
    },

    // 取得玩家擁有的家具（根據 source 過濾）
    getOwnedFurniture(ownedIds) {
        return this.data.furniture.filter(f => ownedIds.includes(f.furniture_id));
    },

    getEquipment(equipmentId) {
        return this.data.equipment.find(e => e.equipment_id === equipmentId);
    },

    // 取得玩家擁有的裝備
    getOwnedEquipment(ownedIds) {
        return this.data.equipment.filter(e => ownedIds.includes(e.equipment_id));
    },

    getAction(actionId) {
        return this.data.actions.find(a => a.action_id === actionId);
    },

    // 取得所有行動（可依 category 篩選）
    getActions(category = null) {
        if (!category) return this.data.actions;
        return this.data.actions.filter(a => a.category === category);
    }
};

window.CSVLoader = CSVLoader;

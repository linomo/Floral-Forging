/**
 * CSVLoader - 負責所有數據的非同步載入
 * 存放路徑：js/core/csv-loader.js
 */
const CSVLoader = {
    data: {
        characters: [], avatars: [], grades: [], physical: [],
        mental: [], weapons: [], metal: [], wood: [],
        comments: [], luckRandom: [], books: []
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
            console.error(e);
            return [];
        }
    },

    async loadAll() {
        console.log('📦 開始載入遊戲資料庫...');
        
        // 分類路徑載入
        this.data.characters = await this.loadCSV('data/chara/chara.csv');
        this.data.avatars = await this.loadCSV('data/chara/PC_avatars.csv');
        
        this.data.weapons = await this.loadCSV('data/items/weapon.csv');
        this.data.books = await this.loadCSV('data/items/book.csv');
        this.data.metal = await this.loadCSV('data/items/metal.csv');
        this.data.wood = await this.loadCSV('data/items/wood.csv');
        
        this.data.grades = await this.loadCSV('data/settings/prefixes_grade.csv');
        this.data.physical = await this.loadCSV('data/settings/prefixes_physical.csv');
        this.data.mental = await this.loadCSV('data/settings/prefixes_mental.csv');
        this.data.comments = await this.loadCSV('data/settings/grade_comment.csv');
        this.data.luckRandom = await this.loadCSV('data/settings/luck_random.csv');
        
        console.log('✅ 資料庫載入完畢', this.data);
        return true;
    },

    getCharacter(charaId) {
        return this.data.characters.find(c => c.chara_id === charaId);
    }
};

window.CSVLoader = CSVLoader;

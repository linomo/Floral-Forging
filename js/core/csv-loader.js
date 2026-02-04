// ===================================
// CSV 載入工具 - 統一管理所有 CSV 資料
// ===================================

const CSVLoader = {
  // 全域資料儲存
  data: {
    characters: [],     // 角色資料
    avatars: [],        // 頭像資料
    grades: [],         // 品級
    physical: [],       // 物理前綴
    mental: [],         // 心理前綴
    weapons: [],        // 武器
    metal: [],          // 金屬
    wood: [],           // 木材
    comments: [],       // 評論
    luckRandom: []      // 幸運抽卡表
  },

  // CSV 讀取函數
  async loadCSV(filename) {
    const response = await fetch(`data/${filename}`);
    const text = await response.text();
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i] ? values[i].trim() : '';
      });
      return obj;
    });
  },

  // 載入所有 CSV
  async loadAll() {
    try {
      console.log('🔄 開始載入 CSV 資料...');
      
      this.data.characters = await this.loadCSV('chara.csv');
      this.data.avatars = await this.loadCSV('PC_avatars.csv');
      this.data.grades = await this.loadCSV('prefixes_grade.csv');
      this.data.physical = await this.loadCSV('prefixes_physical.csv');
      this.data.mental = await this.loadCSV('prefixes_mental.csv');
      this.data.weapons = await this.loadCSV('weapon.csv');
      this.data.metal = await this.loadCSV('metal.csv');
      this.data.wood = await this.loadCSV('wood.csv');
      this.data.comments = await this.loadCSV('grade_comments.csv');
      this.data.luckRandom = await this.loadCSV('luck_random.csv');
      
      console.log('✅ 所有 CSV 載入完成！', this.data);
      return true;
    } catch (error) {
      console.error('❌ CSV 載入失敗:', error);
      return false;
    }
  },

  // 取得角色資料
  getCharacter(charaId) {
    return this.data.characters.find(c => c.chara_id === charaId);
  },

  // 取得所有角色
  getAllCharacters() {
    return this.data.characters;
  }
};

// 匯出全域可用
window.CSVLoader = CSVLoader;

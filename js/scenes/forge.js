// ===================================
// 鍛造室場景
// ===================================

const ForgeScene = {
  // 渲染場景標題
  renderHeader() {
    const ep = Math.floor(2 * (player.int + player.dex + player.str) / 3);
    
    return `
      <span style="font-weight: bold; font-size: 1.1em;">📍 鍛造室</span>
      <span style="margin-left: 15px; color: #888;">
        ⚡元氣：<span style="color: #4ecdc4; font-weight: bold;">${ep}</span>
      </span>
      <span style="margin-left: 15px; color: #888;">
        💩髒髒值：<span style="color: #f5576c; font-weight: bold;">${player.dirtiness}</span>
      </span>
    `;
  },
  
  // 渲染場景內容
  async renderContent() {
    // 從 CSV 讀取鍛造室地圖
    const forgeMap = CSVLoader.data.forgeMap || [];
    
    if (forgeMap.length === 0) {
      return '<div style="padding: 40px; text-align: center; color: #666;">載入中...</div>';
    }
    
    // 生成房間網格 HTML
    let html = '<div class="room-grid">';
    
    // 固定 4x3 網格
    const gridLayout = [
      ['forge_shelf', 'forge_desk', 'forge_decoration', 'forge_window'],
      ['forge_anvil', 'forge_furnace', 'forge_water', 'empty'],
      ['empty', 'forge_materials', 'forge_clean', 'forge_door']
    ];
    
    gridLayout.forEach(row => {
      row.forEach(objId => {
        if (objId === 'empty') {
          // 空格
          html += '<div class="room-item empty"></div>';
        } else {
          // 從 CSV 找到對應物件
          const obj = forgeMap.find(o => o.obj_id === objId);
          
          if (obj) {
            html += `
              <div class="room-item" onclick="clickRoom('${obj.obj_id}')">
                <span class="icon">${obj.icon}</span>
                <span class="label">${obj.name}</span>
              </div>
            `;
          } else {
            // CSV 裡沒有這個物件，顯示佔位
            html += '<div class="room-item empty"></div>';
          }
        }
      });
    });
    
    html += '</div>';
    
    return html;
  },
  
  // 完整渲染
  async render() {
    return {
      header: this.renderHeader(),
      content: await this.renderContent()
    };
  }
};

// 導出（如果使用 ES6 模組）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForgeScene;
}

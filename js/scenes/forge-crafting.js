/**
 * 鍛造系統 - 獨立模組
 * 存放路徑：js/scenes/forge-crafting.js
 */
const ForgeCrafting = {
  selectedDesign: null,
  selectedMetalGrade: '',
  selectedWoodGrade: '',
  
  // === 初始化樣式 ===
  initStyles() {
    if (document.getElementById('forge-crafting-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'forge-crafting-styles';
    style.textContent = `
      .forge-modal {
        background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
        border-radius: 16px;
        padding: 20px;
        max-width: 500px;
        width: 90%;
      }
      
      .forge-section {
        margin-bottom: 20px;
      }
      
      .forge-section-title {
        font-size: 1em;
        color: #f5a623;
        margin-bottom: 10px;
        text-align: center;
      }
      
      .forge-design-select {
        width: 100%;
        padding: 12px;
        font-size: 1em;
        background: rgba(0,0,0,0.3); /*← 這裡是背景色 */
        border: 1px solid rgba(255,255,255,0.2);/* ← 這裡是邊框色 */
        border-radius: 8px;
        color: #fff; /* ← 這裡是文字顏色 */
        font-family: inherit;
        text-align: center;
      }
      
      .forge-design-select:focus {
        outline: none;
        border-color: #f5a623;  /* ← 這裡是選中時的邊框色 */
      }
      .forge-design-select option {
        background:linear-gradient(180deg, #252535 0%, #1a1a28 100%);   /* ← 選項背景色（灰色在這） */
        color: #fff;                   /* ← 選項文字顏色 */
        padding: 10px;                 /* ← 選項內距 */
      }
      
      .forge-design-select option:hover {
        background: rgba(25,25,25,0.2);  /* ← 滑鼠移過去的背景色 */
      }
      
      .forge-design-select option:checked {
        background: rgba(25,25,25,0.2);   /* ← 被選中的背景色 */
        color: #fff;
      }
      .forge-material-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        padding: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
      }
      
      .forge-material-label {
        font-size: 1em;
        min-width: 80px;
        color: #ccc;
      }
      
      .forge-grade-buttons {
        display: flex;
        gap: 8px;
        flex: 1;
      }
      
      .forge-grade-btn {
        flex: 1;
        padding: 8px;
        font-size: 0.9em;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 6px;
        color: #aaa;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      
      .forge-grade-btn:hover:not(:disabled) {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.4);
      }
      
      .forge-grade-btn.selected {
        background: linear-gradient(90deg, #f5a623, #f5576c);
        border-color: #f5a623;
        color: #fff;
        font-weight: bold;
      }
      
      .forge-grade-btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .forge-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 15px;
        padding: 12px;
        background: rgba(0,0,0,0.2);
        border-radius: 8px;
        margin-bottom: 15px;
        font-size: 0.95em;
      }
      
      .forge-preview-item {
        color: #ccc;
      }
      
      .forge-preview-value {
        color: #4ecdc4;
        font-weight: bold;
      }
      
      .forge-action-btn {
        width: 100%;
        padding: 15px;
        font-size: 1.1em;
        background: linear-gradient(90deg, #f5576c, #f093fb);
        border: none;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
        margin-bottom: 15px;
      }
      
      .forge-action-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(245, 87, 108, 0.4);
      }
      
      .forge-action-btn:disabled {
        background: rgba(255,255,255,0.1);
        color: #666;
        cursor: not-allowed;
        transform: none;
      }
      
      .forge-result {
        padding: 20px;
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        text-align: center;
        min-height: 80px;
      }
      
      .forge-result-title {
        font-size: 1.2em;
        color: #f5a623;
        margin-bottom: 10px;
      }
      
      .forge-result-content {
        font-size: 1.1em;
        color: #fff;
      }
      
      .forge-result-price {
        font-size: 1em;
        color: #7ed321;
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
  },
  
  // === 開啟彈窗 ===
  openModal() {
    this.initStyles();
    
    let modal = document.getElementById('forgeModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'forgeModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="forge-modal">
        <div class="modal-title">🔨 鍛造</div>
        
        <div class="forge-section">
          <div class="forge-section-title">【要來創造哪個傳奇？】</div>
          <select class="forge-design-select" id="forgeDesignSelect">
            <option value="">請選擇設計圖</option>
            ${this.generateDesignOptions()}
          </select>
        </div>
        
        // ✨ 材料顯示 ✨
        <div class="forge-section" id="forgeMaterialSection">
          <div class="forge-material-row">
            <div class="forge-material-label">⚙️ 金<span id="forgeMetalNeed">?</span></div>
            <div class="forge-grade-buttons" id="forgeMetalGrades">
              <button class="forge-grade-btn" disabled>爛</button>
              <button class="forge-grade-btn" disabled>普</button>
              <button class="forge-grade-btn" disabled>好</button>
              <button class="forge-grade-btn" disabled>奇</button>
            </div>
          </div>
          
          <div class="forge-material-row">
            <div class="forge-material-label">🥖 木<span id="forgeWoodNeed">?</span></div>
            <div class="forge-grade-buttons" id="forgeWoodGrades">
              <button class="forge-grade-btn" disabled>爛</button>
              <button class="forge-grade-btn" disabled>普</button>
              <button class="forge-grade-btn" disabled>好</button>
              <button class="forge-grade-btn" disabled>奇</button>
            </div>
          </div>
        </div>
        // ✨ 到這裡 ✨
        
        <div class="forge-preview" id="forgePreview">
          <span class="forge-preview-item">⚡ <span class="forge-preview-value" id="forgeEP">0</span></span>
          <span class="forge-preview-item">💰 <span class="forge-preview-value">10元</span></span>
          <span class="forge-preview-item">💩 +<span class="forge-preview-value" id="forgeDirt">0</span></span>
        </div>
        
        <button class="forge-action-btn" id="forgeBtn" disabled>舉起你的槌子來，讓我來看看你的匡匡匡</button>
        
        <div class="forge-result">
          <div class="forge-result-title">☄️ 降落！☄️</div>
          <div class="forge-result-content" id="forgeResultContent">等待鍛造...</div>
          <div class="forge-result-price" id="forgeResultPrice"></div>
        </div>
        
        <div class="modal-actions">
          <button class="modal-btn primary" onclick="ForgeCrafting.closeModal()">關閉</button>
        </div>
      </div>
    `;
    
    this.initControls();
    modal.classList.add('show');
  },
  
  // === 生成設計圖選項 ===
  generateDesignOptions() {
    if (!player.designs || player.designs.length === 0) {
      return '<option value="">尚無設計圖</option>';
    }
    
    return player.designs.map((design, index) => {
      const chNum = ForgeScene.toChineseNumber(design.id);
      return `<option value="${index}">${chNum} ${design.grade}！${design.physical}${design.mental}${design.weapon}</option>`;
    }).join('');
  },
  
  // === 初始化控制項 ===
  initControls() {
    // 選擇設計圖
    document.getElementById('forgeDesignSelect').addEventListener('change', (e) => {
      const index = parseInt(e.target.value);
      if (isNaN(index)) {
        this.selectedDesign = null;
        return;
      }
      
      this.selectedDesign = player.designs[index];
      this.selectedMetalGrade = '';
      this.selectedWoodGrade = '';
      this.updateMaterialOptions();
      this.updatePreview();
    });
    
    // 鍛造按鈕
    document.getElementById('forgeBtn').addEventListener('click', () => {
      this.executeCraft();
    });
  },
  
  // === 更新材料選項 ===
  updateMaterialOptions() {
    if (!this.selectedDesign) return;      
    // 顯示需求數量
    document.getElementById('forgeMetalNeed').textContent = this.selectedDesign.metalNeed;
    document.getElementById('forgeWoodNeed').textContent = this.selectedDesign.woodNeed;
    
    // 生成金屬按鈕
    const metalGradesDiv = document.getElementById('forgeMetalGrades');
    metalGradesDiv.innerHTML = '';
    ['爛', '普', '好', '奇'].forEach(grade => {
      const btn = this.createGradeButton(grade, 'metal');
      metalGradesDiv.appendChild(btn);
    });
    
    // 生成木材按鈕
    const woodGradesDiv = document.getElementById('forgeWoodGrades');
    woodGradesDiv.innerHTML = '';
    ['爛', '普', '好', '奇'].forEach(grade => {
      const btn = this.createGradeButton(grade, 'wood');
      woodGradesDiv.appendChild(btn);
    });
  },
  
  // === 創建品級按鈕 ===
  createGradeButton(grade, type) {
    const btn = document.createElement('button');
    btn.className = 'forge-grade-btn';
    btn.textContent = grade;
    
    // 檢查是否符合條件
    const designGrade = this.selectedDesign.grade.replace('‽', '');
    const gradeOrder = { '爛': 0, '普': 1, '好': 2, '奇': 3 };
    const canUse = gradeOrder[grade] >= gradeOrder[designGrade];
    
    // 檢查材料是否足夠
    const gradeMap = { '爛': '01', '普': '02', '好': '03', '奇': '04' };
    const matId = (type === 'metal' ? 'm' : 'w') + gradeMap[grade];
    const need = type === 'metal' ? this.selectedDesign.metalNeed : this.selectedDesign.woodNeed;
    const have = type === 'metal' 
      ? (player.materials.metal[matId] || 0)
      : (player.materials.wood[matId] || 0);
    const hasEnough = have >= need;
    
    btn.disabled = !canUse || !hasEnough;
    
    btn.addEventListener('click', () => {
      if (type === 'metal') {
        this.selectedMetalGrade = grade;
        // 更新按鈕狀態
        document.querySelectorAll('#forgeMetalGrades .forge-grade-btn').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
      } else {
        this.selectedWoodGrade = grade;
        // 更新按鈕狀態
        document.querySelectorAll('#forgeWoodGrades .forge-grade-btn').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
      }
      this.updatePreview();
    });
    
    return btn;
  },
  
  // === 更新預覽 ===
  updatePreview() {
    if (!this.selectedDesign) return;
    
    const designEP = parseInt(this.selectedDesign.ep) || 0;
    const epCost = Math.max(0, designEP - Math.floor(player.str / 20));
    const dirtIncrease = Math.ceil(epCost / 2);
    
    document.getElementById('forgeEP').textContent = epCost;
    document.getElementById('forgeDirt').textContent = dirtIncrease;
    
    // 檢查是否可以鍛造
    const canCraft = this.selectedMetalGrade && this.selectedWoodGrade && player.currentEP >= epCost && player.money >= 10;
    document.getElementById('forgeBtn').disabled = !canCraft;
  },
  
  // === 執行鍛造 ===
  executeCraft() {
    if (!this.selectedDesign || !this.selectedMetalGrade || !this.selectedWoodGrade) return;
    
    const designEP = parseInt(this.selectedDesign.ep) || 0;
    const epCost = Math.max(0, designEP - Math.floor(player.str / 20));
    
    if (player.currentEP < epCost) {
      showToast('⚡ 元氣不足！');
      return;
    }
    
    if (player.money < 10) {
      showToast('💰 錢不夠！');
      return;
    }
    
    // 計算成品價格
    const gradeMap = { '爛': '01', '普': '02', '好': '03', '奇': '04' };
    const metalId = 'm' + gradeMap[this.selectedMetalGrade];
    const woodId = 'w' + gradeMap[this.selectedWoodGrade];
    
    const metalData = CSVLoader.data.metal.find(m => m.m_id === metalId);
    const woodData = CSVLoader.data.wood.find(w => w.w_id === woodId);
    const weaponData = CSVLoader.data.weapons.find(w => w.name === this.selectedDesign.weapon);
    
    const metalPrice = parseInt(metalData.price) || 0;
    const woodPrice = parseInt(woodData.price) || 0;
    const metalNeed = this.selectedDesign.metalNeed;
    const woodNeed = this.selectedDesign.woodNeed;
    
    const weaponMulti = weaponData ? parseFloat(weaponData.price_multiplier.replace('*', '')) : 1;
    
    // 從設計圖的物理前綴資料中取得價格倍率
    const physicalData = CSVLoader.data.physical.find(p => p.name === this.selectedDesign.physical);
    const physicalMulti = physicalData ? parseFloat(physicalData.effect_value_2.replace('*', '')) : 1;
    
    const sellPrice = Math.floor((metalNeed * metalPrice + woodNeed * woodPrice) * weaponMulti * physicalMulti);
    
    // 扣除材料
    player.materials.metal[metalId] -= metalNeed;
    player.materials.wood[woodId] -= woodNeed;
    
    // 扣除 EP 和金錢
    player.currentEP -= epCost;
    player.money -= 10;
    
    // 增加髒髒值
    player.dirtiness = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));
    
    // 創建成品
    const product = {
      id: player.products.length + 1,
      grade: this.selectedDesign.grade,
      physical: this.selectedDesign.physical,
      mental: this.selectedDesign.mental,
      weapon: this.selectedDesign.weapon,
      sellPrice: sellPrice,
      metalGrade: this.selectedMetalGrade,
      woodGrade: this.selectedWoodGrade
    };
    
    player.products.push(product);
    
    // 顯示結果
    const chNum = ForgeScene.toChineseNumber(product.id);
    document.getElementById('forgeResultContent').textContent = 
      `${chNum} ${product.grade}！${product.physical}${product.mental}${product.weapon}`;
    document.getElementById('forgeResultPrice').textContent = `💰 售價 ${sellPrice}元`;
    
    updateStatsDisplay();
    showToast(`✨ 鍛造成功！獲得 ${product.weapon}！`);
    DialogueSystem.showDialogue('PC', `匡匡匡！完成了！${product.grade}！${product.weapon}！`);
    
    // 重置選單
    setTimeout(() => {
      this.closeModal();
      this.openModal();
    }, 2000);
  },
  
  // === 關閉彈窗 ===
  closeModal() {
    const modal = document.getElementById('forgeModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
};

window.ForgeCrafting = ForgeCrafting;

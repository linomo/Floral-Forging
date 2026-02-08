// ===================================
// 鍛造室場景（重構版 v2.6）
// ===================================

const ForgeScene = {
  currentDesign: null,  // 當前設計圖
  
  // === 中文數字轉換 ===
  toChineseNumber(num) {
    const digits = ['零', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖'];
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return digits[tens] + digits[ones];
  },
  
  // === 渲染場景標題 ===
  renderHeader() {
    // 計算最大 EP
    const maxEP = Math.floor(2 * (player.int + player.dex + player.str) / 3);
    const currentEP = player.currentEP || 0;
    
    return `
      <span style="font-weight: bold; font-size: 1.1em;">📍 鍛造室</span>
      <span style="margin-left: 15px; color: #888;">
        ⚡元氣：<span id="header-ep" style="color: #4ecdc4; font-weight: bold;">${currentEP}</span> / <span id="header-max-ep">${maxEP}</span>
      </span>
      <span style="margin-left: 15px; color: #888;">
        💩髒髒值：<span id="header-dirtiness" style="color: #f5576c; font-weight: bold;">${player.dirtiness}</span>
      </span>
    `;
  },
  
  // === 更新數值 ===
  updateValues() {
    const maxEP = Math.floor(2 * (player.int + player.dex + player.str) / 3);
    const epElement = document.getElementById('header-ep');
    const maxEpElement = document.getElementById('header-max-ep');
    const dirtyElement = document.getElementById('header-dirtiness');
    
    if (epElement) epElement.textContent = player.currentEP || 0;
    if (maxEpElement) maxEpElement.textContent = maxEP;
    if (dirtyElement) dirtyElement.textContent = player.dirtiness;
  },
  
  // === 渲染場景內容 ===
  async renderContent() {
    const forgeMap = CSVLoader.data.forgeMap || [];
    
    if (forgeMap.length === 0) {
      return '<div style="padding: 40px; text-align: center; color: #666;">載入中...</div>';
    }
    
    const maxRow = Math.max(...forgeMap.map(o => parseInt(o.row) || 0));
    const maxCol = Math.max(...forgeMap.map(o => parseInt(o.col) || 0));

    let html = `<div class="room-grid" style="grid-template-columns: repeat(${maxCol}, 80px);">`;
    
    for (let r = 1; r <= maxRow; r++) {
      for (let c = 1; c <= maxCol; c++) {
        const obj = forgeMap.find(o => parseInt(o.row) === r && parseInt(o.col) === c);
        
        if (obj && obj.obj_id !== 'empty') {
          html += `
            <div class="room-item" onclick="ForgeScene.clickRoom('${obj.obj_id}')">
              <span class="icon">${obj.icon}</span>
              <span class="label">${obj.name}</span>
            </div>
          `;
        } else {
          html += '<div class="room-item empty"></div>';
        }
      }
    }
    
    html += '</div>';
    return html;
  },
  
  // === 完整渲染 ===
  async render() {
    return {
      header: this.renderHeader(),
      content: await this.renderContent()
    };
  },
  
  // === 房間物件點擊 ===
  clickRoom(objId) {
    const obj = CSVLoader.getForgeObject(objId);
    if (!obj) {
      console.error(`找不到物件: ${objId}`);
      return;
    }
    
    switch (obj.action_type) {
      case 'open_modal':
        this.handleOpenModal(obj);
        break;
      case 'dialogue':
        this.handleDialogue(obj);
        break;
      case 'clean_room':
        this.handleCleanRoom(obj);
        break;
      case 'confirm_exit':
        this.handleConfirmExit(obj);
        break;
      default:
        console.warn(`未知的動作類型: ${obj.action_type}`);
    }
  },
  
  // === 處理開啟彈窗 ===
  handleOpenModal(obj) {
    if (obj.comment) {
      DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    }
    
    const modalId = obj.action_param;
    switch (modalId) {
      case 'design_modal':
        this.openDesignModal();
        break;
      case 'inventory_modal':
        this.openInventoryModal();
        break;
      case 'book_modal':
        this.openBookModal();
        break;
      case 'forge_modal':
        showToast('鍛造系統開發中...');
        break;
      case 'smelt_modal':
        showToast('冶煉系統開發中...');
        break;
      case 'decoration_modal':
        showToast('裝飾系統開發中...');
        break;
      default:
        console.warn(`未知的 modal: ${modalId}`);
    }
  },
  
  // === 處理純對話 ===
  handleDialogue(obj) {
    if (obj.comment) {
      DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    }
  },
  
  // === 處理打掃 ===
  handleCleanRoom(obj) {
    const epCost = parseInt(obj.ep_cost) || 0;
    
    if (player.currentEP < epCost) {
      showToast("⚡ 元氣不足，無法打掃！");
      return;
    }
    
    if (obj.comment) {
      DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    }
    
    const cleanAmount = 50;
    player.currentEP -= epCost;
    player.dirtiness = Math.max(0, player.dirtiness - cleanAmount);
    
    updateStatsDisplay();
    
    showToast(`✨ 打掃完成！汙穢值 -${cleanAmount}（消耗 ${epCost} EP）`);
  },
  
  // === 處理確認離開 ===
  handleConfirmExit(obj) {
    const confirmMsg = obj.confirm_message || '確定要離開嗎？';
    const buttons = obj.confirm_buttons ? obj.confirm_buttons.split('│') : ['確定', '取消'];
    
    this.openConfirmModal(
      confirmMsg,
      buttons[0],
      buttons[1],
      () => {
        showToast('離開鍛造室...');
      }
    );
  },
  
  // === 設計圖彈窗 ===
  openDesignModal() {
    document.getElementById('designModal').classList.add('show');
    this.currentDesign = null;
    document.getElementById('designCard').innerHTML = '<div class="card-placeholder">在腦中構思設計圖...</div>';
    document.getElementById('designCard').className = 'card';
    DialogueSystem.hideDesignComments();
  },
  
  closeDesignModal() {
    document.getElementById('designModal').classList.remove('show');
    DialogueSystem.hideDesignComments();
  },
  
  // === 繪製設計圖 ===
  drawDesign() {
    const epCost = CSVLoader.getModalEpCost('design_modal', '繪製') || 0;
    const baseMoneyCost = 30;

    if (player.currentEP < epCost) {
      showToast("⚡ 元氣不足，無法構思設計圖！");
      return;
    }
    if (player.money < baseMoneyCost) {
      showToast("💰 錢不夠買紙筆...");
      return;
    }

    const design = DesignGenerator.draw(player);
    if (!design) {
      showToast('❌ 你還沒學會任何武器的製作方法！請先去書架閱讀書籍。');
      DialogueSystem.showDialogue('PC', '欸？我根本不知道要畫什麼劍...還是先去看看書吧。');
      return;
    }

    const dirtinessIncrease = epCost / 2;
    let extraCleaningFee = 0;
    if (player.dirtiness >= 99) {
      extraCleaningFee = dirtinessIncrease;
    }

    // 扣除資源
    player.currentEP -= epCost;
    player.money -= (baseMoneyCost + extraCleaningFee);
    player.dirtiness = Math.min(100, player.dirtiness + dirtinessIncrease);

    // 計算設計圖價格
    const gradeData = CSVLoader.data.grades.find(g => g.grade === design.grade.replace('‽', ''));
    const gradeMulti = gradeData ? parseFloat(gradeData.effect_value_.replace('*', '')) : 1;
    design.blueprintPrice = Math.floor(30 * Math.pow(gradeMulti, 3));
    
    // 套用心理前綴效果
    this.applyMentalEffects(design.mentalPrefixData);
    
    // 自動收下設計圖
    design.id = player.designs.length + 1;
    player.designs.push(design);
    
    this.currentDesign = design;

    // 渲染卡片
    this.renderDesignCard(design);
    updateStatsDisplay(); 

    if (extraCleaningFee > 0) {
      DialogueSystem.showDialogue('PC', '被小師兄收取清潔費了嗚嗚。也是啦陳年汙垢好難處理。');
    }
    
    showToast(`📜 獲得設計圖：${design.grade}！${design.weapon}`);
    DialogueSystem.showDialogue('PC', `完成了！${design.grade}！${design.physical}${design.mental}${design.weapon}！`);
  },
  
  // === 套用心理前綴效果 ===
  applyMentalEffects(mentalData) {
    if (!mentalData) return;
    
    for (let i = 1; i <= 3; i++) {
      const stat = mentalData[`effect_sta_${i}`];
      const value = mentalData[`effect_value_${i}`];
      
      if (!stat || !value) continue;
      
      const numValue = parseInt(value) || 0;
      
      switch(stat) {
        case 'STRESS':
          player.stress = Math.max(0, Math.min(100, player.stress + numValue));
          break;
        case 'MOOD':
          player.mood = Math.max(0, Math.min(100, player.mood + numValue));
          break;
        case 'INT':
          player.int = Math.max(0, Math.min(100, player.int + numValue));
          break;
        case 'LUCK':
          player.luck = Math.max(0, Math.min(100, player.luck + numValue));
          break;
        case 'SF_FAVOR':
          player.favor.SF = Math.max(0, Math.min(100, (player.favor.SF || 0) + numValue));
          break;
        case 'SS_FAVOR':
          player.favor.SS = Math.max(0, Math.min(100, (player.favor.SS || 0) + numValue));
          break;
        case 'DS_FAVOR':
          player.favor.DS = Math.max(0, Math.min(100, (player.favor.DS || 0) + numValue));
          break;
      }
    }
  },
  
  // === 渲染設計圖卡片 ===
  renderDesignCard(design) {
    const card = document.getElementById('designCard');
    card.className = `card grade-${design.grade}`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-grade grade-${design.grade}">${design.grade}！${design.physical}${design.mental}</div>
        <div class="card-weapon">${design.weapon}</div>
      </div>
      <div class="card-info">
        <div class="info-item"><span class="info-label">⚙️ 金</span><span class="info-value metal">${design.metalNeed}</span></div>
        <div class="info-item"><span class="info-label">🥖 木</span><span class="info-value wood">${design.woodNeed}</span></div>
        <div class="info-item"><span class="info-label">💰 圖紙</span><span class="info-value price">${design.blueprintPrice}</span></div>
        <div class="info-item"><span class="info-label">⚡ EP</span><span class="info-value ep">${design.ep}</span></div>
      </div>
      <div class="card-effects">
        <div class="effect-title">📝 讓我看看！</div>
        <div class="effect-row">${design.effects.length > 0 ? design.effects.join('') : '&nbsp;'}</div>
      </div>
    `;
    DialogueSystem.showDesignComments(design.comments);
  },
  
  // === 材料庫存彈窗 ===
  openInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (!modal) {
      console.error('inventoryModal 不存在！');
      return;
    }
    
    let html = '<div class="inventory-content">';
    
    // 金屬材料
    html += '<div class="inventory-section">';
    html += '<div class="inventory-title">【金屬】</div>';
    html += '<div class="inventory-items">';
    
    const metalItems = [];
    Object.keys(player.materials.metal).forEach(id => {
      const amount = player.materials.metal[id];
      const metalData = CSVLoader.data.metal.find(m => m.m_id === id);
      if (metalData) {
        metalItems.push(`${metalData.name}×${amount}`);
      }
    });
    html += metalItems.join(' | ');
    html += '</div></div>';
    
    // 木材
    html += '<div class="inventory-section">';
    html += '<div class="inventory-title">【木材】</div>';
    html += '<div class="inventory-items">';
    
    const woodItems = [];
    Object.keys(player.materials.wood).forEach(id => {
      const amount = player.materials.wood[id];
      const woodData = CSVLoader.data.wood.find(w => w.w_id === id);
      if (woodData) {
        woodItems.push(`${woodData.name}×${amount}`);
      }
    });
    html += woodItems.join(' | ');
    html += '</div></div>';
    
    // 設計圖
    html += '<div class="inventory-section">';
    html += `<div class="inventory-title">【設計圖】${player.designs.length} 張</div>`;
    html += '<div class="inventory-list">';
    
    player.designs.forEach(d => {
      const chNum = this.toChineseNumber(d.id);
      html += `<div class="inventory-item">${chNum} ${d.grade}！${d.physical}${d.mental}${d.weapon} 💰${d.blueprintPrice}元</div>`;
    });
    
    if (player.designs.length === 0) {
      html += '<div class="inventory-empty">還沒有設計圖</div>';
    }
    
    html += '</div></div>';
    
    // 成品劍
    html += '<div class="inventory-section">';
    html += `<div class="inventory-title">【成品】${player.products.length} 把</div>`;
    html += '<div class="inventory-list">';
    
    player.products.forEach(p => {
      const chNum = this.toChineseNumber(p.id);
      html += `<div class="inventory-item">${chNum} ${p.grade}！${p.physical}${p.mental}${p.weapon} 💰${p.sellPrice || '?'}元</div>`;
    });
    
    if (player.products.length === 0) {
      html += '<div class="inventory-empty">還沒有成品劍</div>';
    }
    
    html += '</div></div>';
    html += '</div>';
    
    const modalContent = modal.querySelector('.inventory-modal-content') || modal;
    modalContent.innerHTML = html;
    
    modal.classList.add('show');
  },
  
  closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  // === 確認彈窗 ===
  openConfirmModal(message, confirmText, cancelText, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const msgElement = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (!modal || !msgElement || !confirmBtn || !cancelBtn) {
      console.error('確認彈窗元素不存在！');
      return;
    }
    
    msgElement.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      this.closeConfirmModal();
      if (onConfirm) onConfirm();
    });
    
    newCancelBtn.addEventListener('click', () => this.closeConfirmModal());
    
    modal.classList.add('show');
  },
  
  closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  // === 書籍系統 ===
  
  initBookStyles() {
    if (document.getElementById('book-system-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'book-system-styles';
    style.textContent = `
      .book-modal {
        background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
        border-radius: 16px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 70vh;
        overflow-y: auto;
      }
      
      .book-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 15px 0;
      }
      
      .book-item {
        padding: 15px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
      }
      
      .book-item:hover {
        background: rgba(255,255,255,0.1);
        border-color: rgba(255,255,255,0.3);
        transform: translateY(-2px);
      }
      
      .book-item-name {
        font-size: 1.1em;
        font-weight: bold;
        color: #f5a623;
      }
      
      .book-scroll {
        background: linear-gradient(180deg, #3a3a4a 0%, #2a2a38 100%);
        border-radius: 12px;
        padding: 0;
        max-width: 600px;
        width: 90%;
        border: 3px solid #556b2f;  // // 深綠邊框
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      
      .book-scroll-header {
        background: linear-gradient(180deg, #556b2f, #6b8e23);  // // 深綠漸層
        padding: 20px;
        text-align: center;
        border-radius: 9px 9px 0 0;
      }
      
      .book-scroll-title {
        font-size: 1.5em;
        font-weight: bold;
        color: #fff;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      }
      
      .book-scroll-meta {
        display: flex;
        justify-content: space-around;
        padding: 15px 20px;
        background: rgba(0,0,0,0.2);
        border-top: 1px solid rgba(85,107,47,0.3);
        border-bottom: 1px solid rgba(85,107,47,0.3);
      }
      
      .book-scroll-meta-item {
        text-align: center;
        color: #ccc;
        font-size: 0.95em;
      }
      
      .book-scroll-meta-label {
        color: #888;
        margin-right: 5px;
      }
      
      .book-scroll-content {
        padding: 25px 30px;
        text-align: center;
        line-height: 1.8;
        color: #ddd;
        font-size: 1em;
        min-height: 100px;
      }
      
      .book-scroll-footer {
        padding: 20px;
        text-align: center;
        background: rgba(0,0,0,0.1);
        border-radius: 0 0 9px 9px;
      }
      
      .book-read-btn {
        padding: 12px 40px;
        font-size: 1.1em;
        background: linear-gradient(90deg, #f5a623, #f5576c);
        border: none;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      
      .book-read-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(245,166,35,0.4);
      }
      
      .book-read-btn:disabled {
        background: rgba(255,255,255,0.1);
        color: #666;
        cursor: not-allowed;
      }
      
      .book-read-btn:disabled:hover {
        transform: none;
        box-shadow: none;
      }
      
      .book-status-read {
        color: #7ed321;
        font-weight: bold;
      }
      
      .book-status-unread {
        color: #f5576c;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  },
  
  openBookModal() {
    this.initBookStyles();
    
    let modal = document.getElementById('bookModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bookModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    const playerBooks = player.books || [];
    
    if (playerBooks.length === 0) {
      modal.innerHTML = `
        <div class="book-modal">
          <div class="modal-title">📚 書架</div>
          <div style="padding: 40px; text-align: center; color: #666;">
            還沒有任何書籍...
          </div>
          <div class="modal-actions">
            <button class="modal-btn primary" onclick="ForgeScene.closeBookModal()">關閉</button>
          </div>
        </div>
      `;
    } else {
      let booksHtml = '<div class="book-list">';
      
      playerBooks.forEach(bookId => {
        const book = CSVLoader.data.books.find(b => b.book_id === bookId);
        if (book) {
          booksHtml += `
            <div class="book-item" onclick="ForgeScene.openBookScroll('${bookId}')">
              <div class="book-item-name">📖 ${book.name}</div>
            </div>
          `;
        }
      });
      
      booksHtml += '</div>';
      
      modal.innerHTML = `
        <div class="book-modal">
          <div class="modal-title">📚 書架</div>
          ${booksHtml}
          <div class="modal-actions">
            <button class="modal-btn primary" onclick="ForgeScene.closeBookModal()">關閉</button>
          </div>
        </div>
      `;
    }
    
    modal.classList.add('show');
  },
  
  closeBookModal() {
    const modal = document.getElementById('bookModal');
    if (modal) {
      modal.classList.remove('show');
    }
  },
  
  openBookScroll(bookId) {
    this.initBookStyles();
    
    const book = CSVLoader.data.books.find(b => b.book_id === bookId);
    if (!book) {
      console.error(`找不到書籍: ${bookId}`);
      return;
    }
    
    const isRead = player.readBooks.includes(bookId);
    const epCost = parseInt(book.read_ep) || 0;
    
    let scrollModal = document.getElementById('bookScrollModal');
    if (!scrollModal) {
      scrollModal = document.createElement('div');
      scrollModal.id = 'bookScrollModal';
      scrollModal.className = 'modal-overlay';
      document.body.appendChild(scrollModal);
    }
    
    scrollModal.innerHTML = `
      <div class="book-scroll">
        <div class="book-scroll-header">
          <div class="book-scroll-title">${book.name}</div>
        </div>
        
        <div class="book-scroll-meta">
          <div class="book-scroll-meta-item">
            <span class="book-scroll-meta-label">⚡ EP：</span>
            <span>${epCost}</span>
          </div>
          <div class="book-scroll-meta-item">
            <span class="${isRead ? 'book-status-read' : 'book-status-unread'}">
              ${isRead ? '已閱讀' : '未閱讀'}
            </span>
          </div>
        </div>
        
        <div class="book-scroll-content">
          ${book.description}
        </div>
        
        <div class="book-scroll-footer">
          ${isRead ? 
            '<button class="book-read-btn" disabled>已讀過</button>' :
            `<button class="book-read-btn" onclick="ForgeScene.readBook('${bookId}')">閱讀</button>`
          }
          <button class="book-read-btn" style="background: rgba(255,255,255,0.1); margin-top: 10px;" onclick="ForgeScene.closeBookScroll()">返回</button>
        </div>
      </div>
    `;
    
    this.closeBookModal();
    scrollModal.classList.add('show');
  },
  
  closeBookScroll() {
    const scrollModal = document.getElementById('bookScrollModal');
    if (scrollModal) {
      scrollModal.classList.remove('show');
    }
  },
  
  readBook(bookId) {
    const book = CSVLoader.data.books.find(b => b.book_id === bookId);
    if (!book) {
      console.error(`找不到書籍: ${bookId}`);
      return;
    }
    
    const epCost = parseInt(book.read_ep) || 0;
    
    if (player.currentEP < epCost) {
      showToast('⚡ 元氣不足，無法閱讀！');
      return;
    }
    
    // 扣除 EP
    player.currentEP -= epCost;
    
    // 加入已讀列表
    if (!player.readBooks.includes(bookId)) {
      player.readBooks.push(bookId);
    }
    
    // 解鎖武器
    const unlockedWeapons = CSVLoader.data.weapons.filter(w => w.unlock_trigger === bookId);
    unlockedWeapons.forEach(w => {
      if (!player.unlockedWeapons.includes(w.wea_id)) {
        player.unlockedWeapons.push(w.wea_id);
      }
    });
    
    // 更新 UI
    updateStatsDisplay();
    
    // 顯示解鎖訊息
    if (unlockedWeapons.length > 0) {
      const weaponNames = unlockedWeapons.map(w => w.name).join('、');
      showToast(`📖 讀完《${book.name}》！解鎖武器：${weaponNames}`);
      DialogueSystem.showDialogue('PC', `太好了！學會了 ${weaponNames} 的製作方法！`);
    } else {
      showToast(`📖 讀完《${book.name}》！`);
      DialogueSystem.showDialogue('PC', `嗯...雖然沒學到新武器，但還是有收穫的！`);
    }
    
    // 關閉書卷軸
    this.closeBookScroll();
  }
};

// === 全域函數（供 HTML onclick 使用）===
function clickRoom(objId) {
  ForgeScene.clickRoom(objId);
}

function drawDesign() {
  ForgeScene.drawDesign();
}

function closeDesignModal() {
  ForgeScene.closeDesignModal();
}

function closeInventoryModal() {
  ForgeScene.closeInventoryModal();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ForgeScene;
}

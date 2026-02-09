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
        ForgeCrafting.openModal();
        break;
      case 'smelt_modal'://開啟冶煉
        case 'smelt_modal':
        this.openSmeltModal();
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
      // ✨ 乾淨檢查～ ✨
  if (player.dirtiness === 0) {
    showToast("✨ 很乾淨了！");
    DialogueSystem.showDialogue('PC', '很乾淨了！再清下去，小師兄會覺得我們搞破壞！');
    return;
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
        max-width: 400px;
        width: 90%;
        border: 3px solid #556b2f;  // // 深綠邊框
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      
      .book-scroll-header {
        background: linear-gradient(180deg, #556b2f, #6b8e23);
        padding: 20px 20px; /* 🔧 將上下 padding 從 20px 增加到 40px，這樣就會變高一倍 */
        text-align: center;
        border-radius: 9px 9px 0 0;
        display: flex;      /* 🔧 加入這三行，確保標題文字在長高後依然垂直居中 */
        align-items: center;
        justify-content: center;
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
  },
  // ✨ 新增這段 ✨
// === 冶煉系統 ===

  initSmeltStyles() {
    if (document.getElementById('smelt-system-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'smelt-system-styles';
    style.textContent = `
      .smelt-modal {
        background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
        border-radius: 16px;
        padding: 20px;
        max-width: 600px;
        width: 90%;
      }
      
      .smelt-container {
        display: flex;
        gap: 20px;
        margin: 20px 0;
      }
      
      .smelt-column {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 15px;
        text-align: center;
      }
      
      .smelt-column-title {
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 15px;
        color: #f5a623;
      }
      
      .smelt-select {
        width: 100%;
        padding: 10px;
        font-size: 1em;
        background: rgba(0,0,0,0.3);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        color: #fff;
        margin-bottom: 15px;
        font-family: inherit;
        text-align: center;
      }
      
      .smelt-select:focus {
        outline: none;
        border-color: #f5a623;
      }
      
      .smelt-amount-control {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .smelt-arrow {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 8px;
        color: #fff;
        font-size: 1.2em;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .smelt-arrow:hover:not(:disabled) {
        background: rgba(255,255,255,0.2);
        transform: scale(1.1);
      }
      
      .smelt-arrow:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      .smelt-amount-display {
        font-size: 1.5em;
        font-weight: bold;
        color: #fff;
        min-width: 60px;
      }
      
      .smelt-ep-cost {
        font-size: 0.9em;
        color: #4ecdc4;
        margin-bottom: 15px;
      }
      
      .smelt-action-btn {
        width: 100%;
        padding: 12px;
        font-size: 1em;
        background: linear-gradient(90deg, #f5576c, #f093fb);
        border: none;
        border-radius: 10px;
        color: #fff;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      }
      
      .smelt-action-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(245, 87, 108, 0.4);
      }
      
      .smelt-action-btn:disabled {
        background: rgba(255,255,255,0.1);
        color: #666;
        cursor: not-allowed;
      }
      
      .smelt-result {
        margin-top: 20px;
        padding: 20px;
        background: rgba(0,0,0,0.3);
        border-radius: 12px;
        text-align: center;
        min-height: 80px;
        display: none;
      }
      
      .smelt-result.show {
        display: block;
      }
      
      .smelt-result-title {
        font-size: 1.2em;
        color: #f5a623;
        margin-bottom: 10px;
      }
      
      .smelt-result-content {
        font-size: 1.1em;
        color: #fff;
      }
    `;
    document.head.appendChild(style);
  },
  
  openSmeltModal() {
    this.initSmeltStyles();
    
    let modal = document.getElementById('smeltModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'smeltModal';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div class="smelt-modal">
        <div class="modal-title">🔥 冶煉爐</div>
        
        <div class="smelt-container">
          <!-- 處理欄 -->
          <div class="smelt-column">
            <div class="smelt-column-title">🔺 處理</div>
            
            <select class="smelt-select" id="processSelect">
              <option value="">【選擇材料】</option>
              <option value="m00">原礦 (${player.materials.metal.m00 || 0})</option>
              <option value="w00">原木 (${player.materials.wood.w00 || 0})</option>
            </select>
            
            <div class="smelt-amount-control">
              <button class="smelt-arrow" id="processDown">◀</button>
              <div class="smelt-amount-display" id="processAmount">0</div>
              <button class="smelt-arrow" id="processUp">▶</button>
            </div>
            
            <div class="smelt-ep-cost">⚡ <span id="processEP">0</span></div>
            
            <button class="smelt-action-btn" id="processBtn">大火催下去！</button>
          </div>
          
          <!-- 分解欄 -->
          <div class="smelt-column">
            <div class="smelt-column-title">🔻 分解</div>
            
            <select class="smelt-select" id="decomposeSelect">
              <option value="">【選擇材料】</option>
              ${this.generateDecomposeOptions()}
            </select>
            
            <div class="smelt-amount-control">
              <button class="smelt-arrow" id="decomposeDown">◀</button>
              <div class="smelt-amount-display" id="decomposeAmount">0</div>
              <button class="smelt-arrow" id="decomposeUp">▶</button>
            </div>
            
            <div class="smelt-ep-cost">⚡ <span id="decomposeEP">0</span></div>
            
            <button class="smelt-action-btn" id="decomposeBtn">加一些壞壞東嘻</button>
          </div>
        </div>
        
        <!-- 結果顯示 -->
        <div class="smelt-result show" id="smeltResult">
          <div class="smelt-result-title">☄️ 降落！☄️</div>
          <div class="smelt-result-content" id="smeltResultContent">等待冶煉...</div>
        </div>
        
        <div class="modal-actions">
          <button class="modal-btn primary" onclick="ForgeScene.closeSmeltModal()">關閉</button>
        </div>
      </div>
    `;
    
    this.initSmeltControls();
    modal.classList.add('show');
  },
  
  generateDecomposeOptions() {
    let options = '';
    const metals = player.materials.metal;
    const woods = player.materials.wood;
    
    // 金屬（普好奇）
    ['m02', 'm03', 'm04'].forEach(id => {
      const amount = metals[id] || 0;
      if (amount > 0) {
        const mat = CSVLoader.data.metal.find(m => m.m_id === id);
        if (mat) {
          options += `<option value="${id}">${mat.name} (${amount})</option>`;
        }
      }
    });
    
    // 木材（普好奇）
    ['w02', 'w03', 'w04'].forEach(id => {
      const amount = woods[id] || 0;
      if (amount > 0) {
        const mat = CSVLoader.data.wood.find(w => w.w_id === id);
        if (mat) {
          options += `<option value="${id}">${mat.name} (${amount})</option>`;
        }
      }
    });
    
    return options;
  },
  
  initSmeltControls() {
    const processState = { type: '', amount: 0, maxAmount: 0 };
    const decomposeState = { type: '', amount: 0, maxAmount: 0 };
    
    // 處理 - 選擇材料
    document.getElementById('processSelect').addEventListener('change', (e) => {
      processState.type = e.target.value;
      processState.amount = 0;
      
      if (processState.type) {
        const isMetal = processState.type === 'm00';
        const materials = isMetal ? player.materials.metal : player.materials.wood;
        const total = materials[processState.type] || 0;
        processState.maxAmount = Math.floor(total / 10) * 10;
      } else {
        processState.maxAmount = 0;
      }
      
      this.updateSmeltDisplay('process', processState);
    });
    
    // 處理 - 數量調整
    document.getElementById('processDown').addEventListener('click', () => {
      if (processState.amount > 0) {
        processState.amount -= 10;
        this.updateSmeltDisplay('process', processState);
      }
    });
    
    document.getElementById('processUp').addEventListener('click', () => {
      if (processState.amount < processState.maxAmount) {
        processState.amount += 10;
        this.updateSmeltDisplay('process', processState);
      }
    });
    
    // 處理 - 執行
    document.getElementById('processBtn').addEventListener('click', () => {
      this.executeProcess(processState);
    });
    
    // 分解 - 選擇材料
    document.getElementById('decomposeSelect').addEventListener('change', (e) => {
      decomposeState.type = e.target.value;
      decomposeState.amount = 0;
      
      if (decomposeState.type) {
        const isMetal = decomposeState.type.startsWith('m');
        const materials = isMetal ? player.materials.metal : player.materials.wood;
        const total = materials[decomposeState.type] || 0;
        decomposeState.maxAmount = Math.floor(total / 10) * 10;
      } else {
        decomposeState.maxAmount = 0;
      }
      
      this.updateSmeltDisplay('decompose', decomposeState);
    });
    
    // 分解 - 數量調整
    document.getElementById('decomposeDown').addEventListener('click', () => {
      if (decomposeState.amount > 0) {
        decomposeState.amount -= 10;
        this.updateSmeltDisplay('decompose', decomposeState);
      }
    });
    
    document.getElementById('decomposeUp').addEventListener('click', () => {
      if (decomposeState.amount < decomposeState.maxAmount) {
        decomposeState.amount += 10;
        this.updateSmeltDisplay('decompose', decomposeState);
      }
    });
    
    // 分解 - 執行
    document.getElementById('decomposeBtn').addEventListener('click', () => {
      this.executeDecompose(decomposeState);
    });
  },
  
  updateSmeltDisplay(mode, state) {
    const prefix = mode === 'process' ? 'process' : 'decompose';
    
    // 更新數量顯示
    document.getElementById(`${prefix}Amount`).textContent = state.amount;
    
    // 計算 EP
    const ep = this.calculateSmeltEP(state.amount);
    document.getElementById(`${prefix}EP`).textContent = ep;
    
    // 更新按鈕狀態
    document.getElementById(`${prefix}Down`).disabled = state.amount <= 0;
    document.getElementById(`${prefix}Up`).disabled = state.amount >= state.maxAmount;
    document.getElementById(`${prefix}Btn`).disabled = state.amount === 0 || !state.type;
  },
  
  calculateSmeltEP(amount) {
    if (amount === 0) return 0;
    const ep = Math.ceil(amount / (player.str + player.dex) * 60);
    return ep;
  },
  
  executeProcess(state) {
    if (!state.type || state.amount === 0) return;
    
    const epCost = this.calculateSmeltEP(state.amount);
    
    if (player.currentEP < epCost) {
      showToast('⚡ 元氣不足！');
      return;
    }
    
    // 計算產出數量
    const outputAmount = Math.floor(state.amount * player.int / 100);
    
    if (outputAmount === 0) {
      showToast('❌ 智力太低，無法產出任何材料！');
      DialogueSystem.showDialogue('PC', '嗚...我太笨了，什麼都煉不出來...');
      return;
    }
    
    // 計算產出品級
    const gradeValue = player.str + player.int + player.dex;
    const grade = this.getGradeByValue(gradeValue);
    
    // 扣除原料
    const isMetal = state.type === 'm00';
    const materials = isMetal ? player.materials.metal : player.materials.wood;
    materials[state.type] -= state.amount;
    
    // 增加產出
    const gradeMap = { '爛': '01', '普': '02', '好': '03', '奇': '04' };
    const outputId = (isMetal ? 'm' : 'w') + gradeMap[grade];
    materials[outputId] = (materials[outputId] || 0) + outputAmount;
    
    // 扣除 EP 和增加髒髒值
    player.currentEP -= epCost;
    player.dirtiness = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));
    
    // 顯示結果
    const outputMat = isMetal 
      ? CSVLoader.data.metal.find(m => m.m_id === outputId)
      : CSVLoader.data.wood.find(w => w.w_id === outputId);
    
    document.getElementById('smeltResultContent').textContent = `${outputMat.name} × ${outputAmount}！`;
    document.getElementById('smeltResult').classList.add('show');
    
    updateStatsDisplay();
    showToast(`✨ 處理完成！獲得 ${outputMat.name} × ${outputAmount}`);
    DialogueSystem.showDialogue('PC', `煉出來了！${grade}品質的材料！`);
    
    // 重置選單
    setTimeout(() => {
      this.closeSmeltModal();
      this.openSmeltModal();
    }, 2000);
  },
  
  executeDecompose(state) {
    if (!state.type || state.amount === 0) return;
    
    const epCost = this.calculateSmeltEP(state.amount);
    
    if (player.currentEP < epCost) {
      showToast('⚡ 元氣不足！');
      return;
    }
    
    const isMetal = state.type.startsWith('m');
    const materials = isMetal ? player.materials.metal : player.materials.wood;
    
    // 判斷當前品級和目標品級
    const currentGrade = state.type.slice(-2);
    const gradeMap = { '02': '01', '03': '02', '04': '03' }; // 普→爛, 好→普, 奇→好
    const targetGradeId = gradeMap[currentGrade];
    
    if (!targetGradeId) {
      showToast('❌ 無法分解！');
      return;
    }
    
    // 計算產出（比例：奇×2, 好×1.5, 普×1.33）
    const ratioMap = { '04': 2, '03': 1.5, '02': 1.33 };
    const ratio = ratioMap[currentGrade] || 1;
    const outputAmount = Math.floor(state.amount * ratio);
    
    // 扣除原料
    materials[state.type] -= state.amount;
    
    // 增加產出
    const outputId = (isMetal ? 'm' : 'w') + targetGradeId;
    materials[outputId] = (materials[outputId] || 0) + outputAmount;
    
    // 扣除 EP 和增加髒髒值
    player.currentEP -= epCost;
    player.dirtiness = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));
    
    // 顯示結果
    const outputMat = isMetal 
      ? CSVLoader.data.metal.find(m => m.m_id === outputId)
      : CSVLoader.data.wood.find(w => w.w_id === outputId);
    
    document.getElementById('smeltResultContent').textContent = `${outputMat.name} × ${outputAmount}！`;
    document.getElementById('smeltResult').classList.add('show');
    
    updateStatsDisplay();
    showToast(`✨ 分解完成！獲得 ${outputMat.name} × ${outputAmount}`);
    DialogueSystem.showDialogue('PC', `分解成功！變成更多低級材料了！`);
    
    // 重置選單
    setTimeout(() => {
      this.closeSmeltModal();
      this.openSmeltModal();
    }, 2000);
  },
  
  getGradeByValue(value) {
    const row = CSVLoader.data.luckRandom.find(r => {
      const min = parseInt(r.luck_min) || 0;
      const max = parseInt(r.luck_max) || 100;
      return value >= min && value <= max;
    });
    
    if (!row) return '普';
    
    const roll = Math.random() * 100;
    const p爛 = parseInt(row['爛']) || 0;
    const p普 = parseInt(row['普']) || 0;
    const p好 = parseInt(row['好']) || 0;
    
    if (roll < p爛) return '爛';
    if (roll < p爛 + p普) return '普';
    if (roll < p爛 + p普 + p好) return '好';
    return '奇';
  },
  
  closeSmeltModal() {
    const modal = document.getElementById('smeltModal');
    if (modal) {
      modal.classList.remove('show');
    }
  }
  // ✨ 到這裡 ✨
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

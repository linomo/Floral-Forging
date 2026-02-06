// ===================================
// 鍛造室場景（重構版 v2.5）
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
    const ep = Math.floor(2 * (player.int + player.dex + player.str) / 3);
    
    return `
      <span style="font-weight: bold; font-size: 1.1em;">📍 鍛造室</span>
      <span style="margin-left: 15px; color: #888;">
        ⚡元氣：<span>${player.currentEP}/${player.maxEP}</span>
      </span>
      <span style="margin-left: 15px; color: #888;">
        💩髒髒值：<span style="color: #f5576c; font-weight: bold;">${player.dirtiness}</span>
      </span>
    `;
  },
  
  // === 更新數值 ===
  updateValues() {
    const epSpan = document.querySelector('#scene-header span[style*="color: #4ecdc4"]');
    const dirtySpan = document.querySelector('#scene-header span[style*="color: #f5576c"]');
    
    if (epSpan) epSpan.textContent = `${player.currentEP}/${player.maxEP}`;
    if (dirtySpan) dirtySpan.textContent = player.dirtiness;
  }
  
  // === 渲染場景內容 ===
  async renderContent() {
    const forgeMap = CSVLoader.data.forgeMap || [];
    
    if (forgeMap.length === 0) {
      return '<div style="padding: 40px; text-align: center; color: #666;">載入中...</div>';
    }
    
    let html = '<div class="room-grid">';
    
    const gridLayout = [
      ['forge_shelf', 'forge_desk', 'forge_decoration', 'forge_window'],
      ['forge_anvil', 'forge_furnace', 'forge_water', 'empty'],
      ['empty', 'forge_materials', 'forge_clean', 'empty'],
      ['forge_door', 'empty', 'empty', 'empty']
    ];
    
    gridLayout.forEach(row => {
      row.forEach(objId => {
        if (objId === 'empty') {
          html += '<div class="room-item empty"></div>';
        } else {
          const obj = forgeMap.find(o => o.obj_id === objId);
          
          if (obj) {
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
      });
    });
    
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
        showToast('書架系統開發中...');
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
    
    if (obj.comment) {
      DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    }
    
    const cleanAmount = 50;
    player.dirtiness = Math.max(0, player.dirtiness - cleanAmount);   
    player.currentEP -= epCost;// 打掃時（第 180 行附近）
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
    document.getElementById('saveBtn').style.display = 'none';
    DialogueSystem.hideDesignComments();
  },
  
  closeDesignModal() {
    document.getElementById('designModal').classList.remove('show');
    DialogueSystem.hideDesignComments();
  },
  
  // === 繪製設計圖 ===
  drawDesign() {
    const epCost = CSVLoader.getModalEpCost('design_modal', '繪製');
    player.currentEP -= epCost;//繪圖時（第 206 行附近）
    updateStatsDisplay();
    const design = DesignGenerator.draw(player);
    if (!design) {
      console.error('❌ 抽卡失敗！');
      return;
    }
    
    // 計算設計圖價格：30 × (品級倍率)³
    const gradeData = CSVLoader.data.grades.find(g => g.grade === design.grade.replace('‽', ''));
    const gradeMulti = gradeData ? parseFloat(gradeData.effect_value_.replace('*', '')) : 1;
    design.blueprintPrice = Math.floor(30 * Math.pow(gradeMulti, 3));
    
    // 弄髒
    const dirtinessIncrease = epCost / 2;
    
    if (player.dirtiness >= 99) {
      player.money = Math.max(0, player.money - dirtinessIncrease);
      DialogueSystem.showDialogue('PC', '被小師兄收取清潔費了嗚嗚。也是啦陳年汙垢好難處理。');
    }
    
    player.dirtiness = Math.min(100, player.dirtiness + dirtinessIncrease);
    updateStatsDisplay();
    
    this.currentDesign = design;
    
    // 渲染卡片
    const card = document.getElementById('designCard');
    card.className = `card grade-${design.grade}`;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-grade grade-${design.grade}">${design.grade}！${design.physical}${design.mental}</div>
        <div class="card-weapon">${design.weapon}</div>
      </div>
      <div class="card-info">
        <div class="info-item">
          <span class="info-label">⚙️ 金</span>
          <span class="info-value metal">${design.metalNeed}</span>
        </div>
        <div class="info-item">
          <span class="info-label">🥖 木</span>
          <span class="info-value wood">${design.woodNeed}</span>
        </div>
        <div class="info-item">
          <span class="info-label">💰 圖紙</span>
          <span class="info-value price">${design.blueprintPrice}</span>
        </div>
        <div class="info-item">
          <span class="info-label">⚡ EP</span>
          <span class="info-value ep">${design.ep}</span>
        </div>
      </div>
      <div class="card-effects">
        <div class="effect-title">📝 讓我看看！</div>
        <div class="effect-row">${design.effects.length > 0 ? design.effects.join('') : '&nbsp;'}</div>
      </div>
    `;
    
    DialogueSystem.showDesignComments(design.comments);
    document.getElementById('saveBtn').style.display = 'block';
  },
  
  // === 儲存設計圖 ===
  saveDesign() {
    if (this.currentDesign) {
      // 加入 ID
      this.currentDesign.id = player.designs.length + 1;
      player.designs.push(this.currentDesign);
      
      showToast(`📜 獲得設計圖：${this.currentDesign.grade}！${this.currentDesign.weapon}`);
      this.closeDesignModal();
      DialogueSystem.showDialogue('PC', `完成了！${this.currentDesign.grade}！${this.currentDesign.physical}${this.currentDesign.mental}${this.currentDesign.weapon}！`);
    }
  },
  
  // === 材料庫存彈窗 ===
  openInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (!modal) {
      console.error('inventoryModal 不存在！');
      return;
    }
    
    // 生成材料庫存 HTML
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
  }
};

// === 全域函數（供 HTML onclick 使用）===
function clickRoom(objId) {
  ForgeScene.clickRoom(objId);
}

function drawDesign() {
  ForgeScene.drawDesign();
}

function saveDesign() {
  ForgeScene.saveDesign();
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

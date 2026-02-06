// ===================================
// 主遊戲邏輯
// ===================================

// 🔧 汙穢值系統規則：
// - 範圍：0-100
// - 弄髒公式：消耗EP / 2
// - 打掃效果：-50
// - 髒髒值懲罰：≥99 時，弄髒行為會扣錢（扣除金額 = 弄髒值）

// 🔧 場景系統
let currentScene = 'forge'; // 當前場景：forge（鍛造室）、room（房間）、schedule（行程表）

// 玩家資料
const player = {
  name: '小哈',
  avatar: '🔨',
  str: 30,
  int: 25,
  dex: 40,
  luck: 50,
  mood: 50,
  stress: 25,
  money: 100, // 🔧 新增：金錢
  dirtiness: 0, // 汙穢值（0-100）
  favor: { SF: 20, SS: 10, DS: 0 },
  readBooks: ['book01'], // 預設讀完第一本書
  designs: [],
  unlockedAvatars: ['avatars01']
};

let currentDesign = null;

// === 🔧 場景系統 ===
const SCENES = {
  forge: {
    name: '鍛造室',
    icon: '📍'
  },
  room: {
    name: '小哈的房間',
    icon: '🏠'
  },
  schedule: {
    name: '行程表',
    icon: '📅'
  }
};

// 切換場景
function switchScene(sceneId) {
  if (!SCENES[sceneId]) {
    console.error(`場景不存在: ${sceneId}`);
    return;
  }
  
  currentScene = sceneId;
  renderScene();
}

// 🔧 渲染場景（動態載入場景內容）
async function renderScene() {
  const sceneHeaderEl = document.getElementById('scene-header');
  const sceneContentEl = document.getElementById('scene-content');
  
  if (!sceneHeaderEl || !sceneContentEl) {
    console.error('場景容器不存在！請檢查 HTML');
    return;
  }
  
  // 根據當前場景渲染
  let sceneData = { header: '', content: '' };
  
  switch(currentScene) {
    case 'forge':
      // 鍛造室場景
      if (typeof ForgeScene !== 'undefined') {
        sceneData = await ForgeScene.render();
      } else {
        console.error('ForgeScene 未載入！');
        sceneData = {
          header: '📍 鍛造室',
          content: '<div style="padding: 40px; text-align: center; color: #f5576c;">錯誤：forge.js 未載入</div>'
        };
      }
      break;
      
    case 'room':
      // 房間場景（未實作）
      sceneData = {
        header: '<span style="font-weight: bold; font-size: 1.1em;">🏠 小哈的房間</span>',
        content: '<div style="padding: 40px; text-align: center; color: #666;">房間場景開發中...</div>'
      };
      break;
      
    case 'schedule':
      // 行程表（未實作）
      sceneData = {
        header: '<span style="font-weight: bold; font-size: 1.1em;">📅 行程表</span>',
        content: '<div style="padding: 40px; text-align: center; color: #666;">行程表開發中...</div>'
      };
      break;
      
    default:
      sceneData = {
        header: '❓ 未知場景',
        content: '<div style="padding: 40px; text-align: center; color: #f5576c;">場景不存在</div>'
      };
  }
  
  // 更新 DOM
  sceneHeaderEl.innerHTML = sceneData.header;
  sceneContentEl.innerHTML = sceneData.content;
}

// 🔧 更新場景內的數值（不重新渲染整個場景）
function updateSceneValues() {
  const scene = SCENES[currentScene];
  
  // 只在鍛造室更新元氣和汙穢值
  if (currentScene === 'forge') {
    const epDisplay = document.querySelector('#scene-header span[style*="color: #4ecdc4"]');
    const dirtyDisplay = document.querySelector('#scene-header span[style*="color: #f5576c"]');
    
    if (epDisplay) {
      const ep = Math.floor(2 * (player.int + player.dex + player.str) / 3);
      epDisplay.textContent = ep;
    }
    
    if (dirtyDisplay) {
      dirtyDisplay.textContent = player.dirtiness;
    }
  }
}

// === 初始化遊戲 ===
async function initGame() {
  console.log('🎮 初始化遊戲...');
  
  // 載入所有 CSV
  const loaded = await CSVLoader.loadAll();
  if (!loaded) {
    alert('資料載入失敗，請重新整理頁面！');
    return;
  }
  
  // 檢查是否為新遊戲
  const newGameData = localStorage.getItem('floralForger_newGame');
  if (newGameData) {
    const data = JSON.parse(newGameData);
    player.name = data.playerName;
    player.avatar = data.playerAvatar || '🔨';
    localStorage.removeItem('floralForger_newGame');
    console.log(`👋 歡迎，${player.name}！`);
  }
  
  // 更新顯示
  updatePlayerDisplay();
  updateStatsDisplay();
  
  // 🔧 渲染初始場景（鍛造室）
  await renderScene();
  
  // 🔧 修正：從 CSV 讀取初始對話
  const sfChar = CharacterSystem.getCharacter('SF');
  if (sfChar) {
    DialogueSystem.showDialogue('SF', '今天開始學鍛造，先去書桌畫設計圖吧。');
  }
  
  console.log('✅ 遊戲初始化完成！');
}

// === 更新玩家顯示 ===
function updatePlayerDisplay() {
  CharacterSystem.updateDisplay(player.name, player.avatar);
}

// === 更新數值顯示 ===
function updateStatsDisplay() {
  document.getElementById('str-val').textContent = player.str;
  document.getElementById('int-val').textContent = player.int;
  document.getElementById('dex-val').textContent = player.dex;
  document.getElementById('luck-val').textContent = player.luck;
  
  document.getElementById('mood-bar').style.width = player.mood + '%';
  document.getElementById('stress-bar').style.width = player.stress + '%';
  
  // 🔧 更新金錢
  const moneyDisplay = document.getElementById('money-display');
  if (moneyDisplay) {
    moneyDisplay.textContent = player.money;
  }
  
  // 🔧 更新場景內的數值（元氣、汙穢值）
  updateSceneValues();
}

// === 房間互動（從 CSV 讀取）===
function clickRoom(objId) {
  // 🔧 從 CSV 取得物件資料
  const obj = CSVLoader.getForgeObject(objId);
  if (!obj) {
    console.error(`找不到物件: ${objId}`);
    return;
  }
  
  // 根據 action_type 執行不同動作
  switch (obj.action_type) {
    case 'open_modal':
      handleOpenModal(obj);
      break;
    case 'dialogue':
      handleDialogue(obj);
      break;
    case 'clean_room':
      handleCleanRoom(obj);
      break;
    case 'confirm_exit':
      handleConfirmExit(obj);
      break;
    default:
      console.warn(`未知的動作類型: ${obj.action_type}`);
  }
}

// === 處理開啟彈窗 ===
function handleOpenModal(obj) {
  // 先顯示對話
  if (obj.comment) {
    DialogueSystem.showDialogue(obj.chara_id, obj.comment);
  }
  
  // 根據 modal 類型開啟
  const modalId = obj.action_param;
  switch (modalId) {
    case 'design_modal':
      openDesignModal();
      break;
    case 'book_modal':
      // 書架彈窗（尚未實作）
      showToast('書架系統開發中...');
      break;
    case 'forge_modal':
      // 鍛造彈窗（尚未實作）
      // TODO: 鍛造時計算汙穢值 = selectedDesign.ep / 2
      showToast('鍛造系統開發中...');
      break;
    case 'smelt_modal':
      // 冶煉彈窗（尚未實作）
      // TODO: 冶煉時計算汙穢值 = EP消耗 / 2
      showToast('冶煉系統開發中...');
      break;
    case 'decoration_modal':
      // 裝飾彈窗（尚未實作）
      showToast('裝飾系統開發中...');
      break;
    case 'inventory_modal':
      // 材料庫存（尚未實作）
      showToast('材料庫存開發中...');
      break;
    default:
      console.warn(`未知的 modal: ${modalId}`);
  }
}

// === 處理純對話 ===
function handleDialogue(obj) {
  if (obj.comment) {
    DialogueSystem.showDialogue(obj.chara_id, obj.comment);
  }
}

// === 處理打掃 ===
function handleCleanRoom(obj) {
  const epCost = parseInt(obj.ep_cost) || 0;
  
  // TODO: 檢查 EP 是否足夠
  // if (player.ep < epCost) { ... }
  
  // 顯示對話
  if (obj.comment) {
    DialogueSystem.showDialogue(obj.chara_id, obj.comment);
  }
  
  // 🔧 執行打掃效果：減少 50 點汙穢
  const cleanAmount = 50;
  player.dirtiness = Math.max(0, player.dirtiness - cleanAmount);
  
  // 更新顯示
  updateStatsDisplay();
  
  showToast(`✨ 打掃完成！汙穢值 -${cleanAmount}（消耗 ${epCost} EP）`);
}

// === 處理確認離開 ===
function handleConfirmExit(obj) {
  // 🔧 使用遊戲內彈窗而不是 confirm()
  const confirmMsg = obj.confirm_message || '確定要離開嗎？';
  const buttons = obj.confirm_buttons ? obj.confirm_buttons.split('│') : ['確定', '取消'];
  
  openConfirmModal(
    confirmMsg,
    buttons[0],
    buttons[1],
    () => {
      // 確定離開
      showToast('離開鍛造室...');
      // TODO: 實際的離開邏輯
    }
  );
}

// === 設計圖彈窗 ===
function openDesignModal() {
  document.getElementById('designModal').classList.add('show');
  currentDesign = null;
  document.getElementById('designCard').innerHTML = '<div class="card-placeholder">在腦中構思設計圖...</div>';
  document.getElementById('designCard').className = 'card';
  document.getElementById('saveBtn').style.display = 'none';
  DialogueSystem.hideDesignComments();
}

function closeDesignModal() {
  document.getElementById('designModal').classList.remove('show');
  DialogueSystem.hideDesignComments();
}

// === 繪製設計圖 ===
function drawDesign() {
  // 🔧 檢查 EP（從 CSV 讀取）
  const epCost = CSVLoader.getModalEpCost('design_modal', '繪製');
  // TODO: if (player.ep < epCost) { ... }
  
  const design = DesignGenerator.draw(player);
  if (!design) {
    console.error('❌ 抽卡失敗！');
    return;
  }
  
  // 🔧 繪製設計圖增加汙穢值：EP / 2
  const dirtinessIncrease = epCost / 2; // 10 / 2 = 5
  
  // 🔧 髒髒值懲罰：≥99 時扣錢
  if (player.dirtiness >= 99) {
    player.money = Math.max(0, player.money - dirtinessIncrease);
    DialogueSystem.showDialogue('PC', '被小師兄收取清潔費了嗚嗚。也是啦陳年汙垢好難處理。');
  }
  
  player.dirtiness = Math.min(100, player.dirtiness + dirtinessIncrease);
  updateStatsDisplay();
  
  currentDesign = design;
  
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
        <span class="info-label">🪵 木</span>
        <span class="info-value wood">${design.woodNeed}</span>
      </div>
      <div class="info-item">
        <span class="info-label">💰 價格</span>
        <span class="info-value price">${design.price}</span>
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
  
  // 顯示評論（在彈窗下方）
  DialogueSystem.showDesignComments(design.comments);
  
  // 顯示儲存按鈕
  document.getElementById('saveBtn').style.display = 'block';
}

// === 儲存設計圖 ===
function saveDesign() {
  if (currentDesign) {
    player.designs.push(currentDesign);
    showToast(`📜 獲得設計圖：${currentDesign.grade}！${currentDesign.weapon}`);
    closeDesignModal();
    DialogueSystem.showDialogue('PC', `完成了！${currentDesign.grade}！${currentDesign.physical}${currentDesign.mental}${currentDesign.weapon}！`);
  }
}

// === Toast 提示 ===
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// === 對話繼續 ===
function nextDialogue() {
  showToast('（繼續中...）');
}

// === 🔧 新增：確認彈窗 ===
function openConfirmModal(message, confirmText, cancelText, onConfirm) {
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
  
  // 移除舊的事件監聽器（避免重複）
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  // 設定新的事件監聽器
  newConfirmBtn.addEventListener('click', () => {
    closeConfirmModal();
    if (onConfirm) onConfirm();
  });
  
  newCancelBtn.addEventListener('click', closeConfirmModal);
  
  modal.classList.add('show');
}

function closeConfirmModal() {
  const modal = document.getElementById('confirmModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

// === 頁面載入後初始化 ===
document.addEventListener('DOMContentLoaded', initGame);

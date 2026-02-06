// ===================================
// 主遊戲邏輯
// ===================================

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
  favor: { SF: 20, SS: 10, DS: 0 },
  readBooks: ['book01'], // 預設讀完第一本書
  designs: [],
  unlockedAvatars: ['avatars01']
};

let currentDesign = null;

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
      showToast('鍛造系統開發中...');
      break;
    case 'smelt_modal':
      // 冶煉彈窗（尚未實作）
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
  
  // TODO: 執行打掃效果
  showToast(`✨ 打掃完成！（消耗 ${epCost} EP）`);
}

// === 處理確認離開 ===
function handleConfirmExit(obj) {
  // TODO: 實作確認對話框
  const confirmMsg = obj.confirm_message || '確定要離開嗎？';
  if (confirm(confirmMsg)) {
    showToast('離開鍛造室...');
    // TODO: 實際的離開邏輯
  }
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

// === 頁面載入後初始化 ===
document.addEventListener('DOMContentLoaded', initGame);

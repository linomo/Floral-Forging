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
  designs: [],
  unlockedAvatars: ['avatars01'] // 預設解鎖🔨
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
  
  // 顯示歡迎對話
  DialogueSystem.showDialogue('SF', '今天開始學鍛造，先去書桌畫設計圖吧。');
  
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
  
  // 更新橫條
  document.getElementById('mood-bar').style.width = player.mood + '%';
  document.getElementById('stress-bar').style.width = player.stress + '%';
}

// === 房間互動 ===
function clickRoom(item) {
  const actions = {
    desk: () => openDesignModal(),
    shelf: () => DialogueSystem.showDialogue('PC', '書架上有好多鍛造的書......'),
    anvil: () => DialogueSystem.showDialogue('SF', '先畫好設計圖再來打鐵。'),
    furnace: () => DialogueSystem.showDialogue('PC', '爐火很旺，可以開始工作了。'),
    water: () => DialogueSystem.showDialogue('PC', '淬火用的水桶，水還很乾淨。'),
    materials: () => DialogueSystem.showDialogue('PC', '材料庫存......金: 50, 木: 50'),
    window: () => DialogueSystem.showDialogue('PC', '外面天氣不錯。'),
    door: () => DialogueSystem.showDialogue('SF', '做完事再出去！')
  };
  
  if (actions[item]) actions[item]();
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
  const design = DesignGenerator.draw(player);
  if (!design) return;
  
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

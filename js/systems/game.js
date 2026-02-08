// ===================================
// 遊戲核心邏輯（重構版 v2.5）
// ===================================

// 場景系統
let currentScene = 'forge';

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
  money: 100,
  
  // 最大元氣：動態計算公式
  get maxEP() {
    return Math.floor(2 * (this.str + this.int + this.dex) / 3);
  },
  set maxEP(value) {
    // 留空，讓 Object.assign 賦值時不會報錯
  },
  currentEP: 0, // 當前元氣（初始化時會設定）
  
  dirtiness: 0,
  favor: { SF: 20, SS: 10, DS: 0 },
  
  // 材料庫存
  materials: {
    metal: { m00: 10, m01: 10, m02: 10, m03: 10, m04: 10 },
    wood: { w00: 10, w01: 10, w02: 10, w03: 10, w04: 10 }
  },
  
  // 設計圖、成品、裝備、書籍
  designs: [],      // 設計圖（完整物件）
  products: [],     // 成品劍（完整物件）
  equipment: ['equip01'],  // 裝備 ID
  books: ['book01'],       // 擁有的書籍 ID
  readBooks: [],           // 已讀過的書籍 ID
  unlockedWeapons: [],  // 已解鎖的武器 ID
  unlockedAvatars: ['avatars01']
};

// === 場景系統 ===
const SCENES = {
  forge: { name: '鍛造室', icon: '📍' },
  room: { name: '小哈的房間', icon: '🏠' },
  schedule: { name: '行程表', icon: '📅' }
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

// 渲染場景
async function renderScene() {
  const sceneHeaderEl = document.getElementById('scene-header');
  const sceneContentEl = document.getElementById('scene-content');
  
  if (!sceneHeaderEl || !sceneContentEl) {
    console.error('場景容器不存在！');
    return;
  }
  
  let sceneData = { header: '', content: '' };
  
  switch(currentScene) {
    case 'forge':
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
      sceneData = {
        header: '<span style="font-weight: bold; font-size: 1.1em;">🏠 小哈的房間</span>',
        content: '<div style="padding: 40px; text-align: center; color: #666;">房間場景開發中...</div>'
      };
      break;
      
    case 'schedule':
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
  
  sceneHeaderEl.innerHTML = sceneData.header;
  sceneContentEl.innerHTML = sceneData.content;
}

// 更新場景內的數值（不重新渲染整個場景）
function updateSceneValues() {
  if (currentScene === 'forge' && typeof ForgeScene !== 'undefined' && ForgeScene.updateValues) {
    ForgeScene.updateValues();
  }
}

// === 初始化遊戲 ===
async function initGame() {
  console.log('🎮 初始化遊戲...');
  
  const loaded = await CSVLoader.loadAll();
  if (!loaded) {
    alert('資料載入失敗，請重新整理頁面！');
    return;
  }
  
  // 🔧 改這裡：先檢查是否為新遊戲
  const newGameData = localStorage.getItem('floralForger_newGame');
  
 if (newGameData) {
  // 新遊戲
  localStorage.removeItem('floralForger_save');
  const data = JSON.parse(newGameData);
  player.name = data.playerName;
  player.avatar = data.playerAvatar || '🔨';
  
  // 🔧 計算並設定初始 EP
  const maxEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
  player.currentEP = maxEP;
  
  localStorage.removeItem('floralForger_newGame');
  console.log(`👋 歡迎，${player.name}！`);
} else {
  // 讀取存檔
  const savedGame = localStorage.getItem('floralForger_save');
  if (savedGame) {
    const saved = JSON.parse(savedGame);
    Object.assign(player, saved);
    console.log('📂 讀取存檔成功', player);  // 🔧 加上 player 看看內容
  } else {
    // 沒有存檔，初始化
    const maxEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
    player.currentEP = maxEP;
  }
}
  
  updatePlayerDisplay();
  updateStatsDisplay();
  await renderScene();
  
  const sfChar = CharacterSystem.getCharacter('SF');
  if (sfChar) {
    DialogueSystem.showDialogue('SF', '今天開始學鍛造，先去書桌畫設計圖吧。');
  }
  
  console.log('✅ 遊戲初始化完成！', player);
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
  
  const moneyDisplay = document.getElementById('money-display');
  if (moneyDisplay) {
    moneyDisplay.textContent = player.money;
  }
  
  updateSceneValues();
}

// === 通用工具函數 ===
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function nextDialogue() {
  showToast('（繼續中...）');
}

// === 頁面載入後初始化 ===
document.addEventListener('DOMContentLoaded', initGame);

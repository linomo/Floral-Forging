/**
 * GameSystem - 玩家資料 & 遊戲核心
 * js/systems/game.js
 */

// === 玩家資料 ===
const player = {
    name:      '小哈',
    avatar:    '🔨',
    str:       30,
    int:       25,
    dex:       40,
    luck:      50,
    mood:      50,
    stress:    25,
    money:     100,
    currentEP: 0,
    dirtiness: 0,
    favor:     { SF: 20, SS: 10, DS: 0 },

    materials: {
        metal: { m00: 10, m01: 10, m02: 10, m03: 10, m04: 10 },
        wood:  { w00: 10, w01: 10, w02: 10, w03: 10, w04: 10 }
    },

    designs:         [],
    products:        [],
    equipment:       ['equip01'],
    books:           ['book01'],
    readBooks:       [],
    unlockedWeapons: [],
    unlockedAvatars: ['avatars01']
};

// === 場景系統 ===
const SCENES = {
    forge:    { name: '鍛造室',   icon: '📍' },
    room:     { name: '小哈的房間', icon: '🏠' },
    schedule: { name: '行程表',   icon: '📅' }
};

let currentScene = 'forge';

function switchScene(sceneId) {
    if (!SCENES[sceneId]) { console.error(`場景不存在: ${sceneId}`); return; }
    currentScene = sceneId;
    renderScene();
}

async function renderScene() {
    const headerEl  = document.getElementById('room-header');
    const contentEl = document.getElementById('room-content');
    if (!headerEl || !contentEl) { console.error('場景容器不存在！'); return; }

    let sceneData = { header: '', content: '' };
    switch (currentScene) {
        case 'forge':
            sceneData = typeof ForgeScene !== 'undefined'
                ? await ForgeScene.render()
                : { header: '📍 鍛造室', content: '<div style="text-align:center;color:#f5576c;padding:40px">錯誤：forge.js 未載入</div>' };
            break;
        case 'room':
            sceneData = { header: '🏠 小哈的房間', content: '<div style="text-align:center;color:#666;padding:40px">房間場景開發中...</div>' };
            break;
        case 'schedule':
            sceneData = { header: '📅 行程表', content: '<div style="text-align:center;color:#666;padding:40px">行程表開發中...</div>' };
            break;
    }

    headerEl.innerHTML  = sceneData.header;
    contentEl.innerHTML = sceneData.content;
}

function updateSceneValues() {
    if (currentScene === 'forge' && typeof ForgeScene !== 'undefined') {
        ForgeScene.updateValues();
    }
}

// === 初始化遊戲 ===
async function initGame() {
    console.log('🎮 初始化遊戲...');

    const loaded = await CSVLoader.loadAll();
    if (!loaded) { alert('資料載入失敗，請重新整理頁面！'); return; }

    const newGameData = localStorage.getItem('floralForger_newGame');
    if (newGameData) {
        console.log('🆕 開始新遊戲');
        localStorage.removeItem('floralForger_save');
        const data    = JSON.parse(newGameData);
        player.name   = data.playerName;
        player.avatar = data.playerAvatar || '🔨';
        player.currentEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
        localStorage.removeItem('floralForger_newGame');
        console.log(`👋 歡迎，${player.name}！初始 EP: ${player.currentEP}`);
    } else {
        const saved = localStorage.getItem('floralForger_save');
        if (saved) {
            Object.assign(player, JSON.parse(saved));
            console.log('📂 讀取存檔成功', player);
        } else {
            player.currentEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
            console.log('📝 初次遊玩，初始化數值');
        }
    }

    updatePlayerDisplay();
    updateStatsDisplay();
    await renderScene();
    DialogueSystem.showDialogue('PC', '是時候展現真正的技術了！');
    console.log('✅ 鍛造室初始化完成！', player);
}

// === 顯示更新 ===
function updatePlayerDisplay() {
    CharacterSystem.updateDisplay(player.name, player.avatar);
}

function updateStatsDisplay() {
    document.getElementById('str-val').textContent    = player.str;
    document.getElementById('int-val').textContent    = player.int;
    document.getElementById('dex-val').textContent    = player.dex;
    document.getElementById('luck-val').textContent   = player.luck;
    document.getElementById('mood-bar').style.width   = player.mood   + '%';
    document.getElementById('stress-bar').style.width = player.stress + '%';

    const moneyEl = document.getElementById('money-val');
    if (moneyEl) moneyEl.textContent = player.money;

    updateSceneValues();
    localStorage.setItem('floralForger_save', JSON.stringify(player));
}

// === 工具函數 ===
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function nextDialogue() { showToast('（繼續中...）'); }

// === 存讀檔 ===
const GameSystem = {
    save() { localStorage.setItem('floralForger_save', JSON.stringify(player)); showToast('💾 已儲存！'); },
    load() {
        const saved = localStorage.getItem('floralForger_save');
        if (!saved) { showToast('❌ 沒有存檔！'); return; }
        Object.assign(player, JSON.parse(saved));
        updatePlayerDisplay();
        updateStatsDisplay();
        renderScene();
        showToast('📂 讀取成功！');
    }
};

window.player     = player;
window.GameSystem = GameSystem;

document.addEventListener('DOMContentLoaded', initGame);

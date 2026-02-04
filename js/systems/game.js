/**
 * Game System - 處理遊戲循環與玩家狀態
 * 存放路徑：js/systems/game.js
 */
const player = {
    name: '小哈',
    avatar: '🔨',
    str: 30, int: 25, dex: 40, luck: 50, mood: 50, stress: 25,
    favor: { SF: 20, SS: 10, DS: 0 },
    readBooks: ['book01'], // 預設讀完第一本書，解鎖初始四把劍
    flags: { "trigger_book01": 1 },
    designs: []
};

let currentDesign = null;

async function initGame() {
    const loaded = await CSVLoader.loadAll();
    if (!loaded) return;
    
    // 如果有存檔或新遊戲命名，在此處理
    updatePlayerDisplay();
    updateStatsDisplay();
    
    if (typeof DialogueSystem !== 'undefined') {
        DialogueSystem.showDialogue('SF', '既然讀完了《首次當劍人》，就去書桌試試畫張短劍設計圖吧。');
    }
}

function updatePlayerDisplay() {
    const pc = CSVLoader.getCharacter('PC');
    const avatarBox = document.querySelector('.avatar-box');
    const avatarName = document.querySelector('.avatar-name');
    if (avatarBox) {
        avatarBox.textContent = player.avatar;
        avatarBox.style.borderColor = pc ? pc.color : '#ccc';
    }
    if (avatarName) {
        avatarName.textContent = player.name;
        avatarName.style.color = pc ? pc.color : '#333';
    }
}

function updateStatsDisplay() {
    // 假設你的 HTML id 與這些名稱對應
    const strEl = document.getElementById('str-val');
    if (strEl) strEl.textContent = player.str;
    // ...其餘屬性更新略過
}

// 繪製與儲存設計圖邏輯
function drawDesign() {
    const design = DesignGenerator.draw(player);
    currentDesign = design;
    
    const card = document.getElementById('designCard');
    if (!card) return;
    
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
    
    if (typeof DialogueSystem !== 'undefined') {
        DialogueSystem.showDesignComments(design.comments);
    }
    document.getElementById('saveBtn').style.display = 'block';
}

function closeDesignModal() {
    document.getElementById('designModal').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', initGame);

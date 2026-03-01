/**
 * GameSystem - 玩家資料 & 遊戲核心
 * js/systems/game.js
 */

// === 玩家資料 ===
const player = {
    name:      '',
    avatar:    '🔨',
    str:       30,
    int:       30,
    dex:       100,
    luck:      50,
    mood:      50,
    stress:    25,
    money:     1000,
    currentEP: 0,
    dirtiness: 0,
    favor: {
        SF: 20, SS: 10, DS: 0,
        sunstreet: 0, moonstreet: 0, starstreet: 0
    },

    materials: {
        metal: { m00: 10, m01: 10, m02: 10, m03: 10, m04: 10 },
        wood:  { w00: 10, w01: 10, w02: 10, w03: 10, w04: 10 }
    },

    designs:         [],
    products:        [],
    ownedEquipment:  ['equip_1', 'equip_2', 'equip_3'],
    equippedItem:    'equip_1',
    books:           ['book01'],
    readBooks:       [],
    unlockedWeapons: [],
    unlockedAvatars: ['avatars01'],

    currentCommissions:           [],
    completedCommissionsThisBoard: [],

    roomExpanded:    false,
    ownedFurniture:  ['furniture_1', 'furniture_2', 'furniture_3'],
    placedFurniture: {},

    bankSettings: {
        lifestyle: '毫無物慾',
        family:    '獨善其身',
        donation:  '先別先別'
    },

    nextSchedule: [],
    streetVisits: 3,

    gameDate: { year: 1, month: 1, period: 1 },

    // 新手教學是否已完成
    introCompleted: false
};

// === 日期常數 ===
const MONTH_NAMES  = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const PERIOD_NAMES = ['上旬','中旬','下旬'];

// === 場景系統 ===
const SCENES = {
    forge:   { name: '鍛造室',     icon: '⚒️' },
    bedroom: { name: '小哈的房間', icon: '🏠' },
};

let currentScene = 'bedroom';  // 預設從臥室開始

function switchScene(sceneId) {
    if (!SCENES[sceneId]) { console.error(`場景不存在: ${sceneId}`); return; }
    currentScene = sceneId;
    renderScene();
    updateSceneSwitchButtons();
}

function updateSceneSwitchButtons() {
    document.querySelectorAll('.scene-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.scene === currentScene);
    });
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
                : { header: '⚒️ 鍛造室', content: '<div style="text-align:center;color:#f5576c;padding:40px">錯誤：forge.js 未載入</div>' };
            break;
        case 'bedroom':
            sceneData = typeof BedroomScene !== 'undefined'
                ? await BedroomScene.render()
                : { header: '🏠 小哈的房間', content: '<div style="text-align:center;color:#666;padding:40px">房間場景開發中...</div>' };
            break;
    }

    headerEl.innerHTML  = sceneData.header;
    contentEl.innerHTML = sceneData.content;
}

function updateSceneValues() {
    if (currentScene === 'forge'   && typeof ForgeScene   !== 'undefined') ForgeScene.updateValues();
    if (currentScene === 'bedroom' && typeof BedroomScene !== 'undefined') BedroomScene.updateValues();
}

// === 日期顯示 ===
function updateDateDisplay() {
    const d = player.gameDate;
    const yearText   = d.year === 1 ? '元年' : `第${d.year}年`;
    const monthText  = MONTH_NAMES[d.month - 1] || `${d.month}月`;
    const periodText = PERIOD_NAMES[d.period - 1] || '上旬';

    const yearEl  = document.getElementById('date-year');
    const monthEl = document.getElementById('date-month');
    const dayEl   = document.getElementById('date-day');

    if (yearEl)  yearEl.textContent  = yearText;
    if (monthEl) monthEl.textContent = `${monthText} ${periodText}`;
    if (dayEl)   dayEl.textContent   = currentScene === 'bedroom' ? '家庭日' : '鍛造中';
}

// === 初始化遊戲 ===
async function initGame() {
    IntroSystem._initOverlay();   // ← 加這行
    IntroSystem._setBlack(true);  // ← 加這行
    console.log('🎮 初始化遊戲...');

    const enterGame = localStorage.getItem('floralForger_enterGame');
    if (!enterGame) {
        window.location.href = 'index.html';
        return;
    }
    localStorage.removeItem('floralForger_enterGame');

    const loaded = await CSVLoader.loadAll();
    if (!loaded) { alert('資料載入失敗，請重新整理頁面！'); return; }

    const newGameData = localStorage.getItem('floralForger_newGame');
    if (newGameData) {
        // === 新遊戲 ===
        console.log('🆕 開始新遊戲');
        localStorage.removeItem('floralForger_save');
        const data    = JSON.parse(newGameData);
        player.name   = data.playerName;
        player.avatar = data.playerAvatar || '🔨';
        player.currentEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
        player.introCompleted = false;
        localStorage.removeItem('floralForger_newGame');

        updatePlayerDisplay();
        updateStatsDisplay();
        updateDateDisplay();

        // 播放開場劇情
        await IntroSystem.start();

    } else {
        // === 讀取存檔 ===
        const saved = localStorage.getItem('floralForger_save');
        if (saved) {
            const savedData = JSON.parse(saved);
            Object.assign(player, savedData);
            _patchPlayerFields();
            console.log('📂 讀取存檔成功');
        } else {
            player.currentEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
        }

        updatePlayerDisplay();
        updateStatsDisplay();
        updateDateDisplay();
        currentScene = player.introCompleted ? 'bedroom' : 'forge';
        await renderScene();
        updateSceneSwitchButtons();
        document.getElementById('speaker-name').textContent = player.name;
        DialogueSystem.showDialogue('PC', '是時候展現真正的技術了！');
    }

    console.log('✅ 遊戲初始化完成！');
}

// === 補齊缺失欄位 ===
function _patchPlayerFields() {
    if (!player.favor.sunstreet)  player.favor.sunstreet  = 0;
    if (!player.favor.moonstreet) player.favor.moonstreet = 0;
    if (!player.favor.starstreet) player.favor.starstreet = 0;
    if (!player.currentCommissions)            player.currentCommissions            = [];
    if (!player.completedCommissionsThisBoard) player.completedCommissionsThisBoard = [];
    if (player.roomExpanded === undefined)     player.roomExpanded = false;
    if (!player.ownedFurniture)               player.ownedFurniture = ['furniture_1', 'furniture_2', 'furniture_3'];
    if (!player.placedFurniture)              player.placedFurniture = {};
    if (!player.bankSettings)                 player.bankSettings = { lifestyle: '毫無物慾', family: '獨善其身', donation: '先別先別' };
    if (!player.ownedEquipment)               player.ownedEquipment = ['equip_1', 'equip_2', 'equip_3'];
    if (player.equippedItem === undefined)    player.equippedItem = 'equip_1';
    if (!player.nextSchedule)                 player.nextSchedule = [];
    if (player.streetVisits === undefined)    player.streetVisits = 3;
    if (!player.gameDate)                     player.gameDate = { year: 1, month: 1, period: 1 };
    if (player.introCompleted === undefined)  player.introCompleted = false;
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

    save() {
        localStorage.setItem('floralForger_save', JSON.stringify(player));
        showToast('💾 已儲存！');
    },

    load() {
        const saved = localStorage.getItem('floralForger_save');
        if (!saved) { showToast('❌ 沒有存檔！'); return; }
        Object.assign(player, JSON.parse(saved));
        _patchPlayerFields();
        updatePlayerDisplay();
        updateStatsDisplay();
        updateDateDisplay();
        renderScene();
        showToast('📂 讀取成功！');
    },

    // =========================================
    // 旬推進（床）
    // =========================================
    advancePeriod() {
        // 1. 存錢筒結算
        const bankResult = BankCore.settleNewPeriod();
        if (bankResult.gameOver) {
            this._showGameOver(bankResult);
            return;
        }

        // 2. 執行排程
        const schedule = player.nextSchedule || [];
        const hasForge = schedule.includes('act_01');
        const results  = ScheduleCore.executeSchedule(schedule);
        player.nextSchedule = [];

        // 3. 時間推進
        this._advanceDate();

        // 4. 重置旬度數值
        player.streetVisits = 3;

        // 5. 更新顯示
        updateStatsDisplay();
        updateDateDisplay();

        // 6. 顯示本旬結果
        this._showPeriodResult(bankResult, results, hasForge);
    },

    _advanceDate() {
        const d = player.gameDate;
        d.period++;
        if (d.period > 3) {
            d.period = 1;
            d.month++;
            if (d.month > 12) { d.month = 1; d.year++; }
        }
    },

    _showPeriodResult(bankResult, scheduleResults, hasForge) {
        const d          = player.gameDate;
        const yearText   = d.year === 1 ? '元年' : `第${d.year}年`;
        const periodText = `${MONTH_NAMES[d.month - 1]} ${PERIOD_NAMES[d.period - 1]}`;

        const bankHtml     = this._buildBankSummaryHtml(bankResult);
        const scheduleHtml = this._buildScheduleSummaryHtml(scheduleResults);

        let modal = document.getElementById('periodResultModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'periodResultModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const nextLabel = hasForge ? '前往鍛造室 ⚒️' : '繼續';

        modal.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 24px;
                max-width: 480px; width: 92%; max-height: 80vh; overflow-y: auto;
            ">
                <div style="text-align:center; color:#f5a623; font-size:1.1em; margin-bottom:4px; font-weight:bold;">
                    ✅ 旬結束
                </div>
                <div style="text-align:center; color:#888; font-size:0.85em; margin-bottom:20px;">
                    下一旬：${yearText} ${periodText}
                </div>
                ${bankHtml}
                ${scheduleHtml}
                <div style="margin-top:20px; display:flex; gap:10px;">
                    <button class="modal-btn primary" style="flex:1; padding:12px; font-size:1em;"
                        onclick="GameSystem._closePeriodResult(${hasForge})">
                        ${nextLabel}
                    </button>
                </div>
            </div>`;

        modal.classList.add('show');
    },

    _buildBankSummaryHtml(bankResult) {
        const costs = bankResult.costs;
        const visibleEffects = bankResult.effects.filter(e =>
            !['SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(e.stat)
        );

        const effectTags = visibleEffects.map(e => {
            const text = BankCore.formatEffect(e.stat, e.value);
            if (!text) return '';
            const color = e.value >= 0 ? '#7ed321' : '#f5576c';
            return `<span style="
                padding: 2px 8px; border-radius: 6px; font-size:0.8em;
                background: rgba(255,255,255,0.07); color: ${color};
            ">${text}</span>`;
        }).filter(Boolean).join(' ');

        return `
            <div style="background:rgba(0,0,0,0.25); border-radius:10px; padding:14px; margin-bottom:12px;">
                <div style="color:#f5a623; font-weight:bold; margin-bottom:10px;">💰 財務結算</div>
                <div style="display:flex; justify-content:space-between; font-size:0.85em; color:#ccc; margin-bottom:6px;">
                    <span>扣除費用</span>
                    <span style="color:#f5576c;">－${costs.lifestyle + costs.family + costs.donation} 元</span>
                </div>
                <div style="font-size:0.75em; color:#666; margin-bottom:8px;">
                    生活費${costs.lifestyle} ＋ 家用${costs.family} ＋ 捐款${costs.donation}
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85em; color:#ccc;">
                    <span>剩餘金錢</span>
                    <span style="color:#f5a623; font-weight:bold;">${player.money} 元</span>
                </div>
                ${effectTags ? `<div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:4px;">${effectTags}</div>` : ''}
            </div>`;
    },

    _buildScheduleSummaryHtml(results) {
        if (!results || results.length === 0) {
            return `<div style="background:rgba(0,0,0,0.2); border-radius:10px; padding:14px; color:#666; text-align:center; font-size:0.85em;">本旬無排程</div>`;
        }

        const statNames = { STR:'力量', INT:'智力', DEX:'敏捷', MOOD:'心情', STRESS:'壓力', LUCK:'幸運', MONEY:'金錢' };

        const items = results.map(r => {
            if (r.needForge) {
                return `
                    <div style="display:flex; align-items:center; gap:10px; padding:10px;
                                background:rgba(245,166,35,0.08); border-radius:8px;">
                        <span style="font-size:1.4em;">${r.icon}</span>
                        <div>
                            <div style="color:#f5a623; font-weight:bold;">${r.actionName}</div>
                            <div style="font-size:0.8em; color:#888;">結束後進入鍛造室</div>
                        </div>
                    </div>`;
            }

            const mergedEffects = {};
            r.effects.forEach(e => {
                mergedEffects[e.stat] = (mergedEffects[e.stat] || 0) + e.value;
            });
            if (r.event && r.event.stat && r.event.value !== 0) {
                mergedEffects[r.event.stat] = (mergedEffects[r.event.stat] || 0) + r.event.value;
            }

            const visibleEffects = Object.entries(mergedEffects)
                .filter(([stat]) => !['SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat));

            const effectStr = visibleEffects.map(([stat, val]) => {
                const name  = statNames[stat] || stat;
                const sign  = val >= 0 ? '+' : '';
                const color = val >= 0 ? '#7ed321' : '#f5576c';
                return `<span style="color:${color}">${name}${sign}${val}</span>`;
            }).join('　');

            const gatherStr = r.gather && r.gather.amount > 0
                ? `<span style="color:#7ed321">${r.gather.message}</span>`
                : '';

            const eventHtml = r.event ? `
                <div style="margin-top:6px; padding:6px 10px;
                            background:rgba(245,166,35,0.07);
                            border-left:2px solid #f5a623; border-radius:4px;">
                    <div style="color:#f5a623; font-size:0.8em; font-weight:bold; margin-bottom:2px;">
                        【遭遇事件】${r.event.name}
                    </div>
                    <div style="color:#ccc; font-size:0.8em;">${r.event.text}</div>
                </div>` : '';

            const bottomLine = [effectStr, gatherStr].filter(Boolean).join('　　');

            return `
                <div style="display:flex; flex-direction:column; gap:4px; padding:10px;
                            background:rgba(255,255,255,0.03); border-radius:8px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span style="font-size:1.4em;">${r.icon}</span>
                        <div style="font-weight:bold; color:#fff;">${r.actionName}</div>
                    </div>
                    ${eventHtml}
                    ${bottomLine ? `<div style="font-size:0.82em; padding-left:4px;">${bottomLine}</div>` : ''}
                </div>`;
        }).join('');

        return `
            <div style="background:rgba(0,0,0,0.2); border-radius:10px; padding:14px;">
                <div style="color:#f5a623; font-weight:bold; margin-bottom:10px;">📋 本旬行程</div>
                <div style="display:flex; flex-direction:column; gap:8px;">${items}</div>
            </div>`;
    },

    _closePeriodResult(hasForge) {
        const modal = document.getElementById('periodResultModal');
        if (modal) modal.classList.remove('show');

        if (hasForge) {
            switchScene('forge');
            DialogueSystem.showDialogue('PC', '好！現在開始鍛造！');
        } else {
            DialogueSystem.showDialogue('PC', '又是新的一旬，加油！');
        }
    },

    _showGameOver(bankResult) {
        let modal = document.getElementById('periodResultModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'periodResultModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 24px;
                max-width: 420px; width: 92%; text-align: center;
            ">
                <div style="font-size:2em; margin-bottom:12px;">💀</div>
                <div style="color:#f5576c; font-size:1.2em; font-weight:bold; margin-bottom:12px;">遊戲結束</div>
                <div style="color:#ccc; font-size:0.9em; margin-bottom:8px;">${bankResult.message}</div>
                <div style="color:#888; font-size:0.85em; margin-bottom:20px;">
                    差 <span style="color:#f5576c;">${bankResult.shortage} 元</span>
                </div>
                <button class="modal-btn primary" style="width:100%; padding:12px;"
                    onclick="window.location.href='index.html'">
                    回到開始畫面
                </button>
            </div>`;

        modal.classList.add('show');
    }
};

window.player            = player;
window.GameSystem        = GameSystem;
window.switchScene       = switchScene;
window.updateDateDisplay = updateDateDisplay;

document.addEventListener('DOMContentLoaded', initGame);

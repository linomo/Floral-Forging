/**
 * DesignUI - 設計圖彈窗
 * js/scenes/design-ui.js
 */
const DesignUI = {
    currentDesign: null,

    _initStyles() {
        if (document.getElementById('design-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'design-system-styles';
        style.textContent = `
            /* === 設計圖 Modal === */
            .design-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 320px; width: 90%;
            }
            .draw-btn {
                width: 100%; padding: 12px; font-size: 1em;
                background: linear-gradient(90deg, #f093fb, #f5576c);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                margin-bottom: 15px; font-family: inherit;
            }
            .draw-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 87, 108, 0.3); }

            /* === 設計圖卡片 === */
            .card {
                background: rgba(0,0,0,0.3); border-radius: 12px;
                overflow: hidden; border: 2px solid #333;
            }
            .card.grade-爛 { border-color: #555; }
            .card.grade-普 { border-color: #4ecdc4; }
            .card.grade-好 { border-color: #ffe66d; }
            .card.grade-奇 { border-color: #ff6b6b; box-shadow: 0 5px 20px rgba(255,107,107,0.3); }
            .card.grade-奇‽ { border-color: #ff6b6b; animation: glow 1.5s infinite; }
            @keyframes glow {
                0%, 100% { box-shadow: 0 5px 20px rgba(255,107,107,0.3); }
                50%       { box-shadow: 0 5px 30px rgba(255,107,107,0.6); }
            }
            .card-header { padding: 12px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .card-grade { font-size: 0.8em; margin-bottom: 3px; }
            .grade-爛  { color: #888; }
            .grade-普  { color: #4ecdc4; }
            .grade-好  { color: #ffe66d; }
            .grade-奇, .grade-奇‽ { color: #ff6b6b; }
            .card-weapon { font-size: 1.2em; font-weight: bold; color: #fff; }
            .card-info {
                padding: 10px 12px; background: rgba(0,0,0,0.2);
                display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 0.8em;
            }
            .info-item  { display: flex; justify-content: space-between; }
            .info-label { color: #666; }
            .info-value { color: #fff; }
            .info-value.metal { color: #f5a623; }
            .info-value.wood  { color: #7ed321; }
            .info-value.price { color: #f5576c; }
            .info-value.ep    { color: #4ecdc4; }
            .card-effects {
                padding: 8px 12px;
                border-top: 1px solid rgba(255,255,255,0.05);
                font-size: 0.75em;
            }
            .effect-title { color: #666; margin-bottom: 4px; }
            .effect-row   { display: flex; flex-wrap: wrap; gap: 6px; min-height: 22px; }
            .effect-tag   { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 8px; }
            .effect-tag.positive { color: #7ed321; }
            .effect-tag.negative { color: #f5576c; }
            .effect-tag.special  { color: #f5a623; background: rgba(245,166,35,0.2); }
            .card-placeholder { padding: 40px 20px; text-align: center; color: #444; font-size: 0.9em; }

            /* === 設計圖評論區塊 === */
            #design-comments {
                display: none;
                padding: 10px 15px;
                border-top: 1px solid rgba(255,255,255,0.05);
                background: rgba(0,0,0,0.15);
            }
            .comment-line { display: flex; gap: 6px; margin-bottom: 5px; font-size: 0.8em; line-height: 1.4; }
            .comment-line:last-child { margin-bottom: 0; }
            .comment-text { color: #bbb; }
        `;
        document.head.appendChild(style);
    },

    open() {
        this._initStyles();

        let modal = document.getElementById('designModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'designModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="design-modal">
                <div class="modal-title">📜 繪製設計圖</div>
                <button class="draw-btn" onclick="drawDesign()">🎴 開始繪製！</button>
                <div class="card" id="designCard">
                    <div class="card-placeholder">在腦中構思設計圖...</div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="closeDesignModal()">關閉</button>
                </div>
            </div>`;

        this.currentDesign = null;
        DialogueSystem.hideDesignComments();
        modal.classList.add('show');
    },

    close() {
        const modal = document.getElementById('designModal');
        if (modal) modal.classList.remove('show');
        DialogueSystem.hideDesignComments();
    },

    draw() {
        const epCost = CSVLoader.getModalEpCost('design_modal', '繪製') || 0;
        const baseMoneyCost = 30;

        if (player.currentEP < epCost) {
            showToast('⚡ 元氣不足，無法構思設計圖！');
            return;
        }
        if (player.money < baseMoneyCost) {
            showToast('💰 錢不夠買紙筆...');
            return;
        }

        const design = DesignGenerator.draw(player);
        if (!design) {
            showToast('❌ 你還沒學會任何武器的製作方法！請先去書架閱讀書籍。');
            DialogueSystem.showDialogue('PC', '欸？我根本不知道要畫什麼劍...還是先去看看書吧。');
            return;
        }

        const dirtinessIncrease = Math.ceil(epCost / 2);
        let extraCleaningFee = 0;
        if (player.dirtiness >= 99) extraCleaningFee = dirtinessIncrease;

        player.currentEP -= epCost;
        player.money     -= (baseMoneyCost + extraCleaningFee);
        player.dirtiness  = Math.min(100, player.dirtiness + dirtinessIncrease);

        const gradeData  = CSVLoader.data.grades.find(g => g.grade === design.grade.replace('‽', ''));
        const gradeMulti = gradeData ? parseFloat(gradeData.effect_value_.replace('*', '')) : 1;
        design.blueprintPrice = Math.floor(30 * Math.pow(gradeMulti, 3));

        this._applyMentalEffects(design.mentalPrefixData);

        design.id = player.designs.length + 1;
        player.designs.push(design);
        this.currentDesign = design;

        this._renderCard(design);
        updateStatsDisplay();

        if (extraCleaningFee > 0) {
            DialogueSystem.showDialogue('PC', '被小師兄收取清潔費了嗚嗚。也是啦陳年汙垢好難處理。');
        }
        showToast(`📜 獲得設計圖：${design.grade}！${design.weapon}`);
        DialogueSystem.showDialogue('PC', `完成了！${design.grade}！${design.physical}${design.mental}${design.weapon}！`);
    },

    _applyMentalEffects(mentalData) {
        if (!mentalData) return;
        for (let i = 1; i <= 3; i++) {
            const stat  = mentalData[`effect_sta_${i}`];
            const value = mentalData[`effect_value_${i}`];
            if (!stat || !value) continue;
            const num = parseInt(value) || 0;
            switch (stat) {
                case 'STRESS':   player.stress   = Math.max(0, Math.min(100, player.stress   + num)); break;
                case 'MOOD':     player.mood      = Math.max(0, Math.min(100, player.mood     + num)); break;
                case 'INT':      player.int       = Math.max(0, Math.min(100, player.int      + num)); break;
                case 'LUCK':     player.luck      = Math.max(0, Math.min(100, player.luck     + num)); break;
                case 'SF_FAVOR': player.favor.SF  = Math.max(0, Math.min(100, (player.favor.SF  || 0) + num)); break;
                case 'SS_FAVOR': player.favor.SS  = Math.max(0, Math.min(100, (player.favor.SS  || 0) + num)); break;
                case 'DS_FAVOR': player.favor.DS  = Math.max(0, Math.min(100, (player.favor.DS  || 0) + num)); break;
            }
        }
    },

    _renderCard(design) {
        console.log('═══════════════════════════════════');
        console.log('🎨 開始渲染設計圖卡片');
        console.log('📊 設計圖資料:', design);
        console.log('📝 評論數量:', design.comments ? design.comments.length : 'undefined');
        console.log('📝 評論內容:', design.comments);
        
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
        
        console.log('🗣️ 準備呼叫 DialogueSystem.showDesignComments');
        console.log('🗣️ 傳入評論:', design.comments);
        DialogueSystem.showDesignComments(design.comments);
        console.log('✅ showDesignComments 呼叫完成');
        console.log('═══════════════════════════════════');
    }
};

window.DesignUI = DesignUI;

// HTML onclick 相容
function drawDesign()       { DesignUI.draw();  }
function closeDesignModal() { DesignUI.close(); }

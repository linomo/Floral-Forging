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
            /* === 設計圖包裹容器 === */
            .design-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 15px;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            /* === 設計圖 Modal === */
            .design-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 380px;          /* 固定寬度 */
                min-height: 450px;     /* 固定最小高度，確保繪製前後一樣大 */
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
                min-height: 250px;     /* 固定最小高度 */
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
            .effect-row   { display: flex; flex-wrap: wrap; gap:3px; min-height: 10px; }
            .effect-tag   { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 8px; }
            .effect-tag.positive { color: #7ed321; }
            .effect-tag.negative { color: #f5576c; }
            .effect-tag.special  { color: #f5a623; background: rgba(245,166,35,0.2); }
            .card-placeholder { 
                min-height: 250px;     /* 跟 card 一樣高 */
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center; 
                color: #444; 
                font-size: 0.9em; 
            }

            /* === 評論容器（獨立區塊，在 wrapper 內）=== */
            .comments-container {
                width: 570px;          /* 380px × 1.5 */
                max-width: 90%;
                background: rgba(20, 20, 30, 0.95);
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.15);
                padding: 15px 20px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .comments-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .comment-line { 
                display: flex; 
                gap: 10px; 
                align-items: flex-start;
                font-size: 0.9em; 
                line-height: 1.6; 
            }
            .comment-icon { 
                font-size: 1.3em; 
                flex-shrink: 0;
                margin-top: 2px;
            }
            .comment-text { 
                flex: 1;
                word-wrap: break-word;
            }
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
            <div class="design-wrapper">
                <div class="design-modal">
                    <div class="modal-title">📝 繪製設計圖</div>
                    <button class="draw-btn" onclick="drawDesign()">🎴 開始繪製！</button>
                    <div class="card" id="designCard">
                        <div class="card-placeholder">在腦中構思設計圖...</div>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-btn primary" onclick="closeDesignModal()">關閉</button>
                    </div>
                </div>
                
                <!-- 評論框（獨立顯示）-->
                <div class="comments-container" id="commentsContainer" style="display: none;">
                    <div class="comments-list" id="commentsList"></div>
                </div>
            </div>`;

        this.currentDesign = null;
        modal.classList.add('show');
    },

    close() {
        const modal = document.getElementById('designModal');
        if (modal) modal.classList.remove('show');
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
                <div class="info-item"><span class="info-label">⚡ 元氣</span><span class="info-value ep">${design.ep}</span></div>
            </div>
            <div class="card-effects">
                <div class="effect-title">📝 讓我看看！</div>
                <div class="effect-row">${design.effects.length > 0 ? design.effects.join('') : '&nbsp;'}</div>
            </div>
        `;
        
        // 渲染評論到獨立容器
        const commentsContainer = document.getElementById('commentsContainer');
        const commentsList = document.getElementById('commentsList');
        
        if (design.comments && design.comments.length > 0) {
            const commentsHtml = design.comments.map(c => {
                const char = CharacterSystem.getCharacter(c.chara_id);
                const icon = char ? char.icon : '❓';
                const color = char ? char.color : '#888';
                return `
                    <div class="comment-line">
                        <span class="comment-icon" style="color: ${color}">${icon}</span>
                        <span class="comment-text" style="color: ${color}">「${c.comment}」</span>
                    </div>`;
            }).join('');
            
            commentsList.innerHTML = commentsHtml;
            commentsContainer.style.display = 'block';
        } else {
            commentsContainer.style.display = 'none';
        }
    }
};

window.DesignUI = DesignUI;

// HTML onclick 相容
function drawDesign()       { DesignUI.draw();  }
function closeDesignModal() { DesignUI.close(); }

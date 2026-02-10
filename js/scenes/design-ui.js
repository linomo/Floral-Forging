/**
 * DesignUI - 設計圖彈窗
 * js/scenes/design-ui.js
 */
const DesignUI = {
    currentDesign: null,

    open() {
        document.getElementById('designModal').classList.add('show');
        this.currentDesign = null;
        document.getElementById('designCard').innerHTML = '<div class="card-placeholder">在腦中構思設計圖...</div>';
        document.getElementById('designCard').className = 'card';
        DialogueSystem.hideDesignComments();
    },

    close() {
        document.getElementById('designModal').classList.remove('show');
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
        DialogueSystem.showDesignComments(design.comments);
    }
};

window.DesignUI = DesignUI;

// HTML onclick 相容
function drawDesign()       { DesignUI.draw();  }
function closeDesignModal() { DesignUI.close(); }

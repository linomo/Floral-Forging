/**
 * SmeltUI - 冶煉彈窗
 * js/scenes/smelt-ui.js
 */
const SmeltUI = {

    // === 樣式初始化 ===
    _initStyles() {
        if (document.getElementById('smelt-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'smelt-system-styles';
        style.textContent = `
            .smelt-modal { background: linear-gradient(180deg, #252535 0%, #1a1a28 100%); border-radius: 16px; padding: 20px; max-width: 600px; width: 90%; }
            .smelt-container { display: flex; gap: 20px; margin: 20px 0; }
            .smelt-column { flex: 1; background: rgba(255,255,255,0.05); border-radius: 12px; padding: 15px; text-align: center; }
            .smelt-column-title { font-size: 1.1em; font-weight: bold; margin-bottom: 15px; color: #f5a623; }
            .smelt-select { width: 100%; padding: 10px; font-size: 1em; background: #B0D068; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; margin-bottom: 15px; font-family: inherit; text-align: center; }
            .smelt-select:focus { outline: none; border-color: #f5a623; }
            .smelt-amount-control { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 15px; }
            .smelt-arrow { width: 40px; height: 40px; background: #f5576c; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 1.2em; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
            .smelt-arrow:hover:not(:disabled) { background: rgba(255,255,255,0.2); transform: scale(1.1); }
            .smelt-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
            .smelt-amount-display { font-size: 1.5em; font-weight: bold; color: #fff; min-width: 60px; }
            .smelt-ep-cost { font-size: 0.9em; color: #4ecdc4; margin-bottom: 15px; }
            .smelt-action-btn { width: 100%; padding: 12px; font-size: 1em; background: linear-gradient(90deg, #f5576c, #f093fb); border: none; border-radius: 10px; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s; }
            .smelt-action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(245, 87, 108, 0.4); }
            .smelt-action-btn:disabled { background: rgba(255,255,255,0.1); color: #666; cursor: not-allowed; }
            .smelt-result { margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; text-align: center; min-height: 80px; display: none; }
            .smelt-result.show { display: block; }
            .smelt-result-title { font-size: 1.2em; color: #f5a623; margin-bottom: 10px; }
            .smelt-result-content { font-size: 1.1em; color: #fff; }
        `;
        document.head.appendChild(style);
    },

    // === 開啟彈窗 ===
    open() {
        this._initStyles();
        let modal = document.getElementById('smeltModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'smeltModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="smelt-modal">
                <div class="modal-title">🔥 冶煉爐</div>
                <div class="smelt-container">
                    <div class="smelt-column">
                        <div class="smelt-column-title">🔺 處理</div>
                        <select class="smelt-select" id="processSelect">
                            <option value="">【選擇材料】</option>
                            <option value="m00">原礦 (${player.materials.metal.m00 || 0})</option>
                            <option value="w00">原木 (${player.materials.wood.w00 || 0})</option>
                        </select>
                        <div class="smelt-amount-control">
                            <button class="smelt-arrow" id="processDown">◀</button>
                            <div class="smelt-amount-display" id="processAmount">0</div>
                            <button class="smelt-arrow" id="processUp">▶</button>
                        </div>
                        <div class="smelt-ep-cost">⚡ <span id="processEP">0</span></div>
                        <button class="smelt-action-btn" id="processBtn">大火催下去！</button>
                    </div>
                    <div class="smelt-column">
                        <div class="smelt-column-title">🔻 分解</div>
                        <select class="smelt-select" id="decomposeSelect">
                            <option value="">【選擇材料】</option>
                            ${this._generateDecomposeOptions()}
                        </select>
                        <div class="smelt-amount-control">
                            <button class="smelt-arrow" id="decomposeDown">◀</button>
                            <div class="smelt-amount-display" id="decomposeAmount">0</div>
                            <button class="smelt-arrow" id="decomposeUp">▶</button>
                        </div>
                        <div class="smelt-ep-cost">⚡ <span id="decomposeEP">0</span></div>
                        <button class="smelt-action-btn" id="decomposeBtn">加一些壞壞東嘻</button>
                    </div>
                </div>
                <div class="smelt-result show" id="smeltResult">
                    <div class="smelt-result-title">☄️ 降落！☄️</div>
                    <div class="smelt-result-content" id="smeltResultContent">等待冶煉...</div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="SmeltUI.close()">關閉</button>
                </div>
            </div>
        `;

        this._initControls();
        modal.classList.add('show');
    },

    // === 關閉彈窗 ===
    close() {
        const modal = document.getElementById('smeltModal');
        if (modal) modal.classList.remove('show');
    },

    _generateDecomposeOptions() {
        let options = '';
        const metals = player.materials.metal;
        const woods  = player.materials.wood;
        ['m02', 'm03', 'm04'].forEach(id => {
            const amount = metals[id] || 0;
            if (amount > 0) {
                const mat = CSVLoader.data.metal.find(m => m.m_id === id);
                if (mat) options += `<option value="${id}">${mat.name} (${amount})</option>`;
            }
        });
        ['w02', 'w03', 'w04'].forEach(id => {
            const amount = woods[id] || 0;
            if (amount > 0) {
                const mat = CSVLoader.data.wood.find(w => w.w_id === id);
                if (mat) options += `<option value="${id}">${mat.name} (${amount})</option>`;
            }
        });
        return options;
    },

    _calcEP(amount) {
        if (amount === 0) return 0;
        return Math.ceil(amount / (player.str + player.dex) * 60);
    },

    _initControls() {
        const processState   = { type: '', amount: 0, maxAmount: 0 };
        const decomposeState = { type: '', amount: 0, maxAmount: 0 };

        const bind = (prefix, state) => {
            document.getElementById(`${prefix}Select`).addEventListener('change', (e) => {
                state.type   = e.target.value;
                state.amount = 0;
                if (state.type) {
                    const isMetal = state.type.startsWith('m');
                    const mats    = isMetal ? player.materials.metal : player.materials.wood;
                    state.maxAmount = Math.floor((mats[state.type] || 0) / 10) * 10;
                } else {
                    state.maxAmount = 0;
                }
                this._updateDisplay(prefix, state);
            });
            document.getElementById(`${prefix}Down`).addEventListener('click', () => {
                if (state.amount > 0) { state.amount -= 10; this._updateDisplay(prefix, state); }
            });
            document.getElementById(`${prefix}Up`).addEventListener('click', () => {
                if (state.amount < state.maxAmount) { state.amount += 10; this._updateDisplay(prefix, state); }
            });
        };

        bind('process',   processState);
        bind('decompose', decomposeState);

        document.getElementById('processBtn').addEventListener('click',   () => this._executeProcess(processState));
        document.getElementById('decomposeBtn').addEventListener('click', () => this._executeDecompose(decomposeState));
    },

    _updateDisplay(prefix, state) {
        document.getElementById(`${prefix}Amount`).textContent = state.amount;
        document.getElementById(`${prefix}EP`).textContent     = this._calcEP(state.amount);
        document.getElementById(`${prefix}Down`).disabled = state.amount <= 0;
        document.getElementById(`${prefix}Up`).disabled   = state.amount >= state.maxAmount;
        document.getElementById(`${prefix}Btn`).disabled  = state.amount === 0 || !state.type;
    },

    _executeProcess(state) {
        if (!state.type || state.amount === 0) return;
        const epCost = this._calcEP(state.amount);
        if (player.currentEP < epCost) { showToast('⚡ 元氣不足！'); return; }

        const outputAmount = Math.floor(state.amount * player.int / 100);
        if (outputAmount === 0) {
            showToast('❌ 智力太低，無法產出任何材料！');
            DialogueSystem.showDialogue('PC', '嗚...我太笨了，什麼都煉不出來...');
            return;
        }

        const gradeValue = player.str + player.int + player.dex;
        const grade      = this._gradeByValue(gradeValue);
        const isMetal    = state.type === 'm00';
        const mats       = isMetal ? player.materials.metal : player.materials.wood;
        mats[state.type] -= state.amount;

        const gradeMap = { '爛': '01', '普': '02', '好': '03', '奇': '04' };
        const outputId = (isMetal ? 'm' : 'w') + gradeMap[grade];
        mats[outputId] = (mats[outputId] || 0) + outputAmount;

        player.currentEP -= epCost;
        player.dirtiness  = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));

        const outputMat = isMetal
            ? CSVLoader.data.metal.find(m => m.m_id === outputId)
            : CSVLoader.data.wood.find(w => w.w_id === outputId);

        document.getElementById('smeltResultContent').textContent = `${outputMat.name} × ${outputAmount}！`;
        document.getElementById('smeltResult').classList.add('show');

        updateStatsDisplay();
        showToast(`✨ 處理完成！獲得 ${outputMat.name} × ${outputAmount}`);
        DialogueSystem.showDialogue('PC', `煉出來了！${grade}品質的材料！`);

        setTimeout(() => { this.close(); this.open(); }, 2000);
    },

    _executeDecompose(state) {
        if (!state.type || state.amount === 0) return;
        const epCost = this._calcEP(state.amount);
        if (player.currentEP < epCost) { showToast('⚡ 元氣不足！'); return; }

        const isMetal    = state.type.startsWith('m');
        const mats       = isMetal ? player.materials.metal : player.materials.wood;
        const currentId  = state.type.slice(-2);
        const downMap    = { '02': '01', '03': '02', '04': '03' };
        const targetId   = downMap[currentId];
        if (!targetId) { showToast('❌ 無法分解！'); return; }

        const ratioMap  = { '04': 2, '03': 1.5, '02': 1.33 };
        const outputAmount = Math.floor(state.amount * (ratioMap[currentId] || 1));
        mats[state.type] -= state.amount;

        const outputKey = (isMetal ? 'm' : 'w') + targetId;
        mats[outputKey] = (mats[outputKey] || 0) + outputAmount;

        player.currentEP -= epCost;
        player.dirtiness  = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));

        const outputMat = isMetal
            ? CSVLoader.data.metal.find(m => m.m_id === outputKey)
            : CSVLoader.data.wood.find(w => w.w_id === outputKey);

        document.getElementById('smeltResultContent').textContent = `${outputMat.name} × ${outputAmount}！`;

        updateStatsDisplay();
        showToast(`✨ 分解完成！獲得 ${outputMat.name} × ${outputAmount}`);
        DialogueSystem.showDialogue('PC', `分解成功！變成更多低級材料了！`);

        setTimeout(() => { this.close(); this.open(); }, 2000);
    },

    _gradeByValue(value) {
        const row = CSVLoader.data.luckRandom.find(r => {
            const min = parseInt(r.luck_min) || 0;
            const max = parseInt(r.luck_max) || 100;
            return value >= min && value <= max;
        });
        if (!row) return '普';
        const roll = Math.random() * 100;
        const p爛 = parseInt(row['爛']) || 0;
        const p普 = parseInt(row['普']) || 0;
        const p好 = parseInt(row['好']) || 0;
        if (roll < p爛) return '爛';
        if (roll < p爛 + p普) return '普';
        if (roll < p爛 + p普 + p好) return '好';
        return '奇';
    }
};

window.SmeltUI = SmeltUI;

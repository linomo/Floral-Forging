/**
 * BankUI - 存錢筒彈窗
 * js/scenes/bank-ui.js
 */
const BankUI = {

    _initStyles() {
        if (document.getElementById('bank-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'bank-system-styles';
        style.textContent = `
            /* === 存錢筒 Modal === */
            .bank-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 450px; width: 90%; max-height: 80vh; overflow-y: auto;
            }
            
            /* 預覽區 */
            .bank-preview {
                background: rgba(0,0,0,0.3);
                border-radius: 10px; padding: 15px;
                margin-bottom: 15px; text-align: center;
            }
            .bank-preview-title {
                font-size: 0.85em; color: #888; margin-bottom: 8px;
            }
            .bank-preview-cost {
                font-size: 1.5em; font-weight: bold; color: #f5a623;
            }
            .bank-preview-detail {
                font-size: 0.8em; color: #666; margin-top: 5px;
            }
            .bank-preview-warning {
                color: #f5576c; font-weight: bold;
            }
            
            /* 設定區塊 */
            .bank-section {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px; padding: 15px;
                margin-bottom: 12px;
            }
            .bank-section-header {
                display: flex; justify-content: space-between;
                align-items: center; margin-bottom: 10px;
            }
            .bank-section-title {
                font-weight: bold; color: #f5a623; font-size: 1em;
            }
            .bank-section-cost {
                font-size: 0.9em; color: #ccc;
            }
            
            /* 選項按鈕 */
            .bank-options {
                display: flex; flex-wrap: wrap; gap: 8px;
            }
            .bank-option {
                flex: 1; min-width: 45%;
                padding: 10px 8px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer; transition: all 0.2s;
                text-align: center; font-family: inherit;
                color: #aaa; font-size: 0.85em;
            }
            .bank-option:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
            }
            .bank-option.selected {
                background: linear-gradient(90deg, #f5a623, #f5576c);
                border-color: #f5a623;
                color: #fff; font-weight: bold;
            }
            .bank-option-name {
                display: block; margin-bottom: 3px;
            }
            .bank-option-cost {
                display: block; font-size: 0.8em; opacity: 0.8;
            }
            
            /* 效果預覽 */
            .bank-effects {
                background: rgba(0,0,0,0.2);
                border-radius: 8px; padding: 12px;
                margin-top: 15px;
            }
            .bank-effects-title {
                font-size: 0.85em; color: #888; margin-bottom: 8px;
            }
            .bank-effects-list {
                display: flex; flex-wrap: wrap; gap: 6px;
                min-height: 24px;
            }
            .bank-effect-tag {
                padding: 3px 8px; border-radius: 6px;
                font-size: 0.8em; background: rgba(255,255,255,0.08);
            }
            .bank-effect-tag.positive { color: #7ed321; }
            .bank-effect-tag.negative { color: #f5576c; }
            
            /* 測試按鈕 */
            .bank-test-btn {
                width: 100%; padding: 12px; font-size: 1em;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                font-family: inherit; transition: all 0.2s;
                margin-top: 15px;
            }
            .bank-test-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
            }
        `;
        document.head.appendChild(style);
    },

    // === 開啟存錢筒 ===
    open() {
        this._initStyles();

        let modal = document.getElementById('bankModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bankModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
        
        this._updatePreview();
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('bankModal');
        if (modal) modal.classList.remove('show');
    },

    // === 建構 Modal HTML ===
    _buildModalHTML() {
        return `
            <div class="bank-modal">
                <div class="modal-title">👛 存錢筒 - 財政規劃</div>
                
                <!-- 費用預覽 -->
                <div class="bank-preview">
                    <div class="bank-preview-title">本旬預計支出</div>
                    <div class="bank-preview-cost" id="bankTotalCost">計算中...</div>
                    <div class="bank-preview-detail" id="bankCostDetail"></div>
                </div>
                
                <!-- 生活品質 -->
                <div class="bank-section">
                    <div class="bank-section-header">
                        <span class="bank-section-title">🏠 生活品質</span>
                        <span class="bank-section-cost" id="bankLifestyleCost"></span>
                    </div>
                    <div class="bank-options">
                        ${this._buildLifestyleOptions()}
                    </div>
                </div>
                
                <!-- 補貼家用 -->
                <div class="bank-section">
                    <div class="bank-section-header">
                        <span class="bank-section-title">👨‍👩‍👧 補貼家用</span>
                        <span class="bank-section-cost" id="bankFamilyCost"></span>
                    </div>
                    <div class="bank-options">
                        ${this._buildFamilyOptions()}
                    </div>
                </div>
                
                <!-- 善心捐款 -->
                <div class="bank-section">
                    <div class="bank-section-header">
                        <span class="bank-section-title">💝 善心捐款</span>
                        <span class="bank-section-cost" id="bankDonationCost"></span>
                    </div>
                    <div class="bank-options">
                        ${this._buildDonationOptions()}
                    </div>
                </div>
                
                <!-- 效果預覽 -->
                <div class="bank-effects">
                    <div class="bank-effects-title">📊 旬數值影響預覽</div>
                    <div class="bank-effects-list" id="bankEffectsList"></div>
                </div>
                
                <!-- 測試結算按鈕（開發用）-->
                <button class="bank-test-btn" onclick="BankUI.testSettle()">
                    🧪 測試結算（開發用）
                </button>
                
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="BankUI.close()">確定</button>
                </div>
            </div>`;
    },

    // === 建構選項按鈕 ===
    _buildLifestyleOptions() {
        const options = BankCore.lifestyleOptions;
        const current = player.bankSettings.lifestyle;
        
        return Object.entries(options).map(([name, data]) => {
            const isSelected = name === current;
            const costText = data.multiplier === 1 ? '×1' : `×${data.multiplier}`;
            return `
                <button class="bank-option ${isSelected ? 'selected' : ''}"
                        onclick="BankUI.selectLifestyle('${name}')">
                    <span class="bank-option-name">${name}</span>
                    <span class="bank-option-cost">${costText}</span>
                </button>`;
        }).join('');
    },

    _buildFamilyOptions() {
        const options = BankCore.familyOptions;
        const current = player.bankSettings.family;
        
        return Object.entries(options).map(([name, data]) => {
            const isSelected = name === current;
            const costText = data.cost === 0 ? '免費' : `${data.cost}元`;
            return `
                <button class="bank-option ${isSelected ? 'selected' : ''}"
                        onclick="BankUI.selectFamily('${name}')">
                    <span class="bank-option-name">${name}</span>
                    <span class="bank-option-cost">${costText}</span>
                </button>`;
        }).join('');
    },

    _buildDonationOptions() {
        const options = BankCore.donationOptions;
        const current = player.bankSettings.donation;
        
        return Object.entries(options).map(([name, data]) => {
            const isSelected = name === current;
            const costText = data.cost === 0 ? '免費' : `${data.cost}元`;
            return `
                <button class="bank-option ${isSelected ? 'selected' : ''}"
                        onclick="BankUI.selectDonation('${name}')">
                    <span class="bank-option-name">${name}</span>
                    <span class="bank-option-cost">${costText}</span>
                </button>`;
        }).join('');
    },

    // === 選擇處理 ===
    selectLifestyle(name) {
        player.bankSettings.lifestyle = name;
        this._refreshOptions();
        this._updatePreview();
        updateStatsDisplay();
    },

    selectFamily(name) {
        player.bankSettings.family = name;
        this._refreshOptions();
        this._updatePreview();
        updateStatsDisplay();
    },

    selectDonation(name) {
        player.bankSettings.donation = name;
        this._refreshOptions();
        this._updatePreview();
        updateStatsDisplay();
    },

    // === 刷新選項顯示 ===
    _refreshOptions() {
        // 重新渲染所有選項區塊
        const sections = document.querySelectorAll('.bank-section');
        if (sections[0]) {
            sections[0].querySelector('.bank-options').innerHTML = this._buildLifestyleOptions();
        }
        if (sections[1]) {
            sections[1].querySelector('.bank-options').innerHTML = this._buildFamilyOptions();
        }
        if (sections[2]) {
            sections[2].querySelector('.bank-options').innerHTML = this._buildDonationOptions();
        }
    },

    // === 更新預覽 ===
    _updatePreview() {
        const costs = BankCore.previewCosts();
        const canAfford = player.money >= costs.total;
        
        // 總費用
        const totalEl = document.getElementById('bankTotalCost');
        if (totalEl) {
            totalEl.textContent = `💰 ${costs.total} 元`;
            totalEl.className = 'bank-preview-cost' + (canAfford ? '' : ' bank-preview-warning');
        }
        
        // 費用明細
        const detailEl = document.getElementById('bankCostDetail');
        if (detailEl) {
            if (!canAfford) {
                detailEl.innerHTML = `<span class="bank-preview-warning">⚠️ 錢不夠！差 ${costs.total - player.money} 元</span>`;
            } else {
                detailEl.textContent = `生活${costs.lifestyle} + 家用${costs.family} + 捐款${costs.donation}`;
            }
        }
        
        // 各區塊費用
        document.getElementById('bankLifestyleCost').textContent = `${costs.lifestyle}元`;
        document.getElementById('bankFamilyCost').textContent = `${costs.family}元`;
        document.getElementById('bankDonationCost').textContent = `${costs.donation}元`;
        
        // 效果預覽
        this._updateEffectsPreview();
    },

    // === 更新效果預覽 ===
    _updateEffectsPreview() {
        const listEl = document.getElementById('bankEffectsList');
        if (!listEl) return;
        
        const allEffects = {};
        
        // 收集所有效果
        const lifestyle = BankCore.lifestyleOptions[player.bankSettings.lifestyle];
        const family = BankCore.familyOptions[player.bankSettings.family];
        const donation = BankCore.donationOptions[player.bankSettings.donation];
        
        [lifestyle, family, donation].forEach(option => {
            if (option && option.effects) {
                Object.entries(option.effects).forEach(([stat, value]) => {
                    allEffects[stat] = (allEffects[stat] || 0) + value;
                });
            }
        });
        
        // 渲染
        if (Object.keys(allEffects).length === 0) {
            listEl.innerHTML = '<span style="color:#666">無數值影響</span>';
        } else {
            listEl.innerHTML = Object.entries(allEffects).map(([stat, value]) => {
                .filter(([stat]) => !['SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat))  // 新增
                .map(([stat, value]) => 
                const text = BankCore.formatEffect(stat, value);
                const cls = value >= 0 ? 'positive' : 'negative';
                return `<span class="bank-effect-tag ${cls}">${text}</span>`;
            })
            .join('');
        }
    },

    // === 測試結算（開發用）===
    testSettle() {
        const result = BankCore.settleNewPeriod();
        
        if (result.gameOver) {
            alert(`💀 遊戲結束！\n\n${result.message}\n\n差 ${result.shortage} 元`);
            return;
        }
        
        updateStatsDisplay();
        this._updatePreview();
        
        let effectsText = '';
        if (result.effects.length > 0) {
            effectsText = result.effects.map(e => 
                `${e.source}: ${BankCore.formatEffect(e.stat, e.value)}`
            ).join('\n');
        }
        
        showToast(`💰 ${result.message}`);
        DialogueSystem.showDialogue('PC', '這旬的生活費付完了～');
        
        console.log('📊 結算結果:', result);
    }
};

window.BankUI = BankUI;

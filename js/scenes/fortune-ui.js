/**
 * FortuneUI - 占卜模組
 * js/scenes/fortune-ui.js
 */
const FortuneUI = {

    _initStyles() {
        if (document.getElementById('fortune-styles')) return;
        const style = document.createElement('style');
        style.id = 'fortune-styles';
        style.textContent = `
            /* === 占卜 Modal === */
            .fortune-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 350px; height: 300px;
                display: flex; flex-direction: column;
            }
            .fortune-question {
                flex: 1; display: flex; flex-direction: column;
                justify-content: center; align-items: center;
                text-align: center; padding: 20px;
            }
            .fortune-witch {
                font-size: 3em; margin-bottom: 15px;
            }
            .fortune-text {
                font-size: 1.1em; color: #fff;
                line-height: 1.6; margin-bottom: 10px;
            }
            .fortune-cost {
                font-size: 0.9em; color: #f5a623;
            }
            .fortune-buttons {
                display: flex; gap: 10px; justify-content: center;
            }
            .fortune-btn {
                padding: 10px 30px;
                border: none; border-radius: 8px;
                cursor: pointer; font-family: inherit;
                font-size: 1em; transition: all 0.2s;
            }
            .fortune-btn-yes {
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                color: #fff;
            }
            .fortune-btn-yes:hover { transform: scale(1.05); }
            .fortune-btn-yes:disabled {
                opacity: 0.5; cursor: not-allowed; transform: none;
            }
            .fortune-btn-no {
                background: rgba(255,255,255,0.1);
                color: #ccc;
            }
            .fortune-btn-no:hover {
                background: rgba(255,255,255,0.15);
            }

            /* === 占卜結果 Modal === */
            .fortune-result-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 350px; height: 380px;
                display: flex; flex-direction: column;
            }
            .fortune-result-content {
                flex: 1; padding: 15px;
            }
            .fortune-result-title {
                text-align: center; font-size: 1.1em;
                color: #f5a623; margin-bottom: 20px;
            }
            .fortune-result-list {
                display: flex; flex-direction: column; gap: 12px;
            }
            .fortune-result-item {
                display: flex; justify-content: space-between;
                align-items: center; padding: 12px;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
            }
            .fortune-result-label {
                color: #ccc; font-size: 0.95em;
            }
            .fortune-result-value {
                font-weight: bold; font-size: 1.1em;
            }
            .fortune-result-value.high { color: #7ed321; }
            .fortune-result-value.medium { color: #f5a623; }
            .fortune-result-value.low { color: #f5576c; }
        `;
        document.head.appendChild(style);
    },

    // === 開啟占卜 ===
    open() {
        this._initStyles();

        let modal = document.getElementById('fortuneModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'fortuneModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const canAfford = player.money >= 500;

        modal.innerHTML = `
            <div class="fortune-modal">
                <div class="modal-title">🧙‍♀️ 占卜攤</div>
                <div class="fortune-question">
                    <div class="fortune-witch">🧙‍♀️</div>
                    <div class="fortune-text">要不要知道別人怎麼看你？</div>
                    <div class="fortune-cost">花費 500 元</div>
                </div>
                <div class="fortune-buttons">
                    <button class="fortune-btn fortune-btn-yes" 
                            ${canAfford ? '' : 'disabled'}
                            onclick="FortuneUI.doFortune()">是</button>
                    <button class="fortune-btn fortune-btn-no" 
                            onclick="FortuneUI.close()">否</button>
                </div>
            </div>`;

        modal.classList.add('show');
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('fortuneModal');
        if (modal) modal.classList.remove('show');
        StreetUI.returnFromShop();
    },

    // === 執行占卜 ===
    doFortune() {
        const result = StreetCore.doFortune();

        if (!result.success) {
            showToast(`❌ ${result.message}`);
            return;
        }

        // 關閉問題彈窗
        const modal = document.getElementById('fortuneModal');
        if (modal) modal.classList.remove('show');

        updateStatsDisplay();

        // 顯示結果
        this._showResult(result.data);
    },

    // === 顯示結果 ===
    _showResult(data) {
        let modal = document.getElementById('fortuneResultModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'fortuneResultModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const getClass = (value) => {
            if (value >= 60) return 'high';
            if (value >= 30) return 'medium';
            return 'low';
        };

        modal.innerHTML = `
            <div class="fortune-result-modal">
                <div class="modal-title">🔮 占卜結果</div>
                <div class="fortune-result-content">
                    <div class="fortune-result-title">別人眼中的你...</div>
                    <div class="fortune-result-list">
                        <div class="fortune-result-item">
                            <span class="fortune-result-label">🌸 師父好感</span>
                            <span class="fortune-result-value ${getClass(data.SF_FAVOR)}">${data.SF_FAVOR}</span>
                        </div>
                        <div class="fortune-result-item">
                            <span class="fortune-result-label">🐕 小師兄好感</span>
                            <span class="fortune-result-value ${getClass(data.SS_FAVOR)}">${data.SS_FAVOR}</span>
                        </div>
                        <div class="fortune-result-item">
                            <span class="fortune-result-label">🍃 大俠好感</span>
                            <span class="fortune-result-value ${getClass(data.DS_FAVOR)}">${data.DS_FAVOR}</span>
                        </div>
                        <div class="fortune-result-item">
                            <span class="fortune-result-label">🍀 幸運值</span>
                            <span class="fortune-result-value ${getClass(data.LUCK)}">${data.LUCK}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="FortuneUI.closeResult()">確定</button>
                </div>
            </div>`;

        modal.classList.add('show');
    },

    // === 關閉結果 ===
    closeResult() {
        const modal = document.getElementById('fortuneResultModal');
        if (modal) modal.classList.remove('show');
        StreetUI.returnFromShop();
    }
};

window.FortuneUI = FortuneUI;

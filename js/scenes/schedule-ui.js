/**
 * ScheduleUI - 排程系統 UI
 * js/scenes/schedule-ui.js
 */
const ScheduleUI = {

    // 暫存排程
    tempSchedule: [],

    _initStyles() {
        if (document.getElementById('schedule-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'schedule-system-styles';
        style.textContent = `
            /* === 排程 Modal === */
            .schedule-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 600px; width: 95%; max-height: 85vh; overflow-y: auto;
            }

            /* 上方資訊 */
            .schedule-info {
                display: flex; justify-content: space-between;
                align-items: center; margin-bottom: 15px;
                padding: 10px 15px; background: rgba(0,0,0,0.3);
                border-radius: 10px;
            }
            .schedule-days {
                font-size: 1.1em; color: #f5a623;
            }
            .schedule-days-warning { color: #f5576c; }

            /* 排程格子區 */
            .schedule-slots {
                display: grid;
                grid-template-columns: repeat(9, 1fr);
                gap: 5px; margin-bottom: 20px;
            }
            .schedule-slot {
                aspect-ratio: 1;
                background: rgba(255,255,255,0.05);
                border: 2px dashed rgba(255,255,255,0.2);
                border-radius: 8px;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                font-size: 0.7em; color: #666;
                cursor: pointer; transition: all 0.2s;
                position: relative;
            }
            .schedule-slot:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.3);
            }
            .schedule-slot.filled {
                background: rgba(78, 205, 196, 0.2);
                border: 2px solid #4ecdc4;
                border-style: solid;
            }
            .schedule-slot.filled .slot-icon {
                font-size: 1.5em;
            }
            .schedule-slot.filled .slot-name {
                font-size: 0.65em; color: #ccc;
                margin-top: 2px; text-align: center;
            }
            .schedule-slot.continuation {
                background: rgba(78, 205, 196, 0.1);
                border: 2px solid rgba(78, 205, 196, 0.5);
                border-style: solid;
            }
            .schedule-slot.continuation .slot-icon {
                font-size: 1em; opacity: 0.5;
            }
            .schedule-slot .slot-day {
                position: absolute; top: 2px; left: 4px;
                font-size: 0.6em; color: #888;
            }
            .schedule-slot .slot-remove {
                position: absolute; top: 2px; right: 4px;
                font-size: 0.8em; color: #f5576c;
                cursor: pointer; opacity: 0;
                transition: opacity 0.2s;
            }
            .schedule-slot.filled:hover .slot-remove {
                opacity: 1;
            }

            /* 行動選擇區 */
            .schedule-actions {
                display: flex; flex-direction: column; gap: 15px;
            }
            .schedule-category {
                background: rgba(255,255,255,0.03);
                border-radius: 10px; padding: 12px;
            }
            .schedule-category-title {
                font-size: 0.9em; color: #f5a623;
                margin-bottom: 10px; font-weight: bold;
            }
            .schedule-action-list {
                display: flex; flex-wrap: wrap; gap: 8px;
            }
            .schedule-action-btn {
                display: flex; align-items: center; gap: 6px;
                padding: 8px 12px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                cursor: pointer; transition: all 0.2s;
                font-family: inherit; color: #ccc;
            }
            .schedule-action-btn:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
                transform: translateY(-2px);
            }
            .schedule-action-btn:disabled {
                opacity: 0.4; cursor: not-allowed;
                transform: none;
            }
            .schedule-action-btn .action-icon {
                font-size: 1.2em;
            }
            .schedule-action-btn .action-name {
                font-size: 0.85em;
            }
            .schedule-action-btn .action-days {
                font-size: 0.7em; color: #888;
                margin-left: 4px;
            }

            /* 確認按鈕 */
            .schedule-confirm {
                margin-top: 20px; display: flex; gap: 10px;
            }
            .schedule-confirm-btn {
                flex: 1; padding: 12px;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                font-family: inherit; font-size: 1em;
            }
            .schedule-confirm-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(78, 205, 196, 0.3);
            }
            .schedule-confirm-btn:disabled {
                opacity: 0.5; cursor: not-allowed;
                transform: none; box-shadow: none;
            }
            .schedule-clear-btn {
                padding: 12px 20px;
                background: rgba(245, 87, 108, 0.2);
                border: 1px solid #f5576c;
                border-radius: 10px; color: #f5576c;
                cursor: pointer; font-family: inherit;
            }
            .schedule-clear-btn:hover {
                background: rgba(245, 87, 108, 0.3);
            }

            /* === 執行結果 Modal === */
            .schedule-result-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 450px; width: 90%; max-height: 70vh; overflow-y: auto;
            }
            .result-list {
                display: flex; flex-direction: column; gap: 10px;
                margin: 15px 0;
            }
            .result-item {
                display: flex; align-items: center; gap: 12px;
                padding: 12px; background: rgba(255,255,255,0.03);
                border-radius: 8px;
            }
            .result-item-icon { font-size: 1.5em; }
            .result-item-info { flex: 1; }
            .result-item-name { font-weight: bold; color: #fff; }
            .result-item-effects {
                font-size: 0.8em; color: #ccc; margin-top: 3px;
            }
            .result-item-gather {
                font-size: 0.85em; color: #7ed321; margin-top: 3px;
            }
        `;
        document.head.appendChild(style);
    },

    // === 開啟排程介面（家庭日）===
    open() {
        this._initStyles();
        this.tempSchedule = [...(player.nextSchedule || [])];

        let modal = document.getElementById('scheduleModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'scheduleModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
        this._updateDisplay();
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('scheduleModal');
        if (modal) modal.classList.remove('show');
    },

    // === 建構 Modal HTML ===
    _buildModalHTML() {
        const indoorActions = ScheduleCore.getIndoorActions();
        const outdoorActions = ScheduleCore.getOutdoorActions();

        return `
            <div class="schedule-modal">
                <div class="modal-title">📅 排程表 - 家庭日</div>

                <!-- 剩餘天數 -->
                <div class="schedule-info">
                    <span>安排下一旬的行程</span>
                    <span class="schedule-days" id="scheduleDays">剩餘 9 天</span>
                </div>

                <!-- 9 格排程 -->
                <div class="schedule-slots" id="scheduleSlots">
                    ${this._buildSlots()}
                </div>

                <!-- 廬內行動 -->
                <div class="schedule-actions">
                    <div class="schedule-category">
                        <div class="schedule-category-title">🏠 廬內</div>
                        <div class="schedule-action-list">
                            ${indoorActions.map(a => this._buildActionBtn(a)).join('')}
                        </div>
                    </div>

                    <!-- 廬外行動 -->
                    <div class="schedule-category">
                        <div class="schedule-category-title">🌄 廬外</div>
                        <div class="schedule-action-list">
                            ${outdoorActions.map(a => this._buildActionBtn(a)).join('')}
                        </div>
                    </div>
                </div>

                <!-- 確認按鈕 -->
                <div class="schedule-confirm">
                    <button class="schedule-clear-btn" onclick="ScheduleUI.clear()">清空</button>
                    <button class="schedule-confirm-btn" id="scheduleConfirmBtn" onclick="ScheduleUI.confirm()">
                        確定排程
                    </button>
                </div>
            </div>`;
    },

    // === 建構 9 格 ===
    _buildSlots() {
        let html = '';
        for (let i = 0; i < 9; i++) {
            html += `<div class="schedule-slot" id="slot-${i}" data-index="${i}">
                <span class="slot-day">${i + 1}</span>
                <span class="slot-icon">+</span>
            </div>`;
        }
        return html;
    },

    // === 建構行動按鈕 ===
    _buildActionBtn(action) {
        const days = parseInt(action.days) || 1;
        return `
            <button class="schedule-action-btn" 
                    data-action-id="${action.action_id}"
                    onclick="ScheduleUI.addAction('${action.action_id}')">
                <span class="action-icon">${action.icon}</span>
                <span class="action-name">${action.name}</span>
                <span class="action-days">(${days}天)</span>
            </button>`;
    },

    // === 加入行動 ===
    addAction(actionId) {
        const check = ScheduleCore.canAddAction(this.tempSchedule, actionId);
        if (!check.canAdd) {
            showToast(`❌ ${check.reason}`);
            return;
        }

        this.tempSchedule.push(actionId);
        this._updateDisplay();
    },

    // === 移除行動（從末尾）===
    removeLastAction() {
        if (this.tempSchedule.length > 0) {
            this.tempSchedule.pop();
            this._updateDisplay();
        }
    },

    // === 清空 ===
    clear() {
        this.tempSchedule = [];
        this._updateDisplay();
    },

    // === 更新顯示 ===
    _updateDisplay() {
        const remaining = ScheduleCore.getRemainingDays(this.tempSchedule);

        // 更新剩餘天數
        const daysEl = document.getElementById('scheduleDays');
        if (daysEl) {
            daysEl.textContent = `剩餘 ${remaining} 天`;
            daysEl.className = 'schedule-days' + (remaining === 0 ? '' : remaining < 3 ? ' schedule-days-warning' : '');
        }

        // 更新格子
        const slotsContainer = document.getElementById('scheduleSlots');
        if (slotsContainer) {
            // 先清空所有格子
            for (let i = 0; i < 9; i++) {
                const slot = document.getElementById(`slot-${i}`);
                if (slot) {
                    slot.className = 'schedule-slot';
                    slot.innerHTML = `<span class="slot-day">${i + 1}</span><span class="slot-icon">+</span>`;
                }
            }

            // 填入排程
            let dayIndex = 0;
            this.tempSchedule.forEach((actionId, scheduleIndex) => {
                const action = CSVLoader.getAction(actionId);
                if (!action) return;

                const days = parseInt(action.days) || 1;

                for (let d = 0; d < days && dayIndex < 9; d++) {
                    const slot = document.getElementById(`slot-${dayIndex}`);
                    if (slot) {
                        if (d === 0) {
                            // 第一天：顯示完整資訊
                            slot.className = 'schedule-slot filled';
                            slot.innerHTML = `
                                <span class="slot-day">${dayIndex + 1}</span>
                                <span class="slot-icon">${action.icon}</span>
                                <span class="slot-name">${action.name}</span>
                                ${scheduleIndex === this.tempSchedule.length - 1 ? 
                                    `<span class="slot-remove" onclick="event.stopPropagation(); ScheduleUI.removeLastAction()">✕</span>` : ''}
                            `;
                        } else {
                            // 後續天：顯示延續
                            slot.className = 'schedule-slot continuation';
                            slot.innerHTML = `
                                <span class="slot-day">${dayIndex + 1}</span>
                                <span class="slot-icon">${action.icon}</span>
                            `;
                        }
                    }
                    dayIndex++;
                }
            });
        }

        // 更新按鈕狀態
        document.querySelectorAll('.schedule-action-btn').forEach(btn => {
            const actionId = btn.dataset.actionId;
            const check = ScheduleCore.canAddAction(this.tempSchedule, actionId);
            btn.disabled = !check.canAdd;
        });

        // 更新確認按鈕（要排滿才能確認）
        const confirmBtn = document.getElementById('scheduleConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = remaining > 0;
        }
    },

    // === 確認排程 ===
    confirm() {
        const remaining = ScheduleCore.getRemainingDays(this.tempSchedule);
        if (remaining > 0) {
            showToast(`❌ 還有 ${remaining} 天沒排！`);
            return;
        }

        // 儲存排程
        player.nextSchedule = [...this.tempSchedule];
        
        this.close();
        showToast('📅 排程已確定！');
        DialogueSystem.showDialogue('PC', '下一旬就這樣安排吧！');

        // 顯示測試執行按鈕（開發用）
        this._showTestButton();
    },

    // === 測試執行按鈕（開發用）===
    _showTestButton() {
        let testBtn = document.getElementById('scheduleTestBtn');
        if (!testBtn) {
            testBtn = document.createElement('button');
            testBtn.id = 'scheduleTestBtn';
            testBtn.style.cssText = `
                position: fixed; bottom: 20px; right: 20px;
                padding: 10px 20px; background: #f5a623;
                border: none; border-radius: 8px; color: #fff;
                cursor: pointer; font-weight: bold; z-index: 100;
            `;
            testBtn.textContent = '🧪 執行排程（測試）';
            testBtn.onclick = () => this.executeSchedule();
            document.body.appendChild(testBtn);
        }
    },

    // === 執行排程 ===
    executeSchedule() {
        if (!player.nextSchedule || player.nextSchedule.length === 0) {
            showToast('❌ 沒有排程！');
            return;
        }

        const results = ScheduleCore.executeSchedule(player.nextSchedule);
        
        // 清空已執行的排程
        player.nextSchedule = [];

        // 顯示結果
        this._showResults(results);
        
        // 更新顯示
        updateStatsDisplay();
    },

    // === 顯示執行結果 ===
    _showResults(results) {
        let modal = document.getElementById('scheduleResultModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'scheduleResultModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const resultsHtml = results.map(r => {
            let effectsText = r.effects.map(e => {
                const sign = e.value >= 0 ? '+' : '';
                return `${e.stat}${sign}${e.value}`;
            }).join(', ');

            let gatherText = r.gather ? r.gather.message : '';

            return `
                <div class="result-item">
                    <span class="result-item-icon">${r.icon}</span>
                    <div class="result-item-info">
                        <div class="result-item-name">${r.actionName}</div>
                        ${effectsText ? `<div class="result-item-effects">${effectsText}</div>` : ''}
                        ${gatherText ? `<div class="result-item-gather">🎁 ${gatherText}</div>` : ''}
                    </div>
                </div>`;
        }).join('');

        modal.innerHTML = `
            <div class="schedule-result-modal">
                <div class="modal-title">📋 本旬執行結果</div>
                <div class="result-list">${resultsHtml}</div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="document.getElementById('scheduleResultModal').classList.remove('show')">確定</button>
                </div>
            </div>`;

        modal.classList.add('show');
    }
};

window.ScheduleUI = ScheduleUI;

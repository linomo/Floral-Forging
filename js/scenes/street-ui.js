/**
 * StreetUI - 街道場景 UI
 * js/scenes/street-ui.js
 */
const StreetUI = {

    _initStyles() {
        if (document.getElementById('street-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'street-system-styles';
        style.textContent = `
            /* === 街道 Modal === */
            .street-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 420px; height: 520px;
                display: flex; flex-direction: column;
            }

            /* 資訊列 */
            .street-info {
                display: flex; justify-content: space-between;
                align-items: center; margin-bottom: 15px;
                padding: 10px 15px; background: rgba(0,0,0,0.3);
                border-radius: 10px;
            }
            .street-visits {
                font-size: 1em; color: #f5a623;
            }
            .street-visits-warning { color: #f5576c; }

            /* 3x3 地圖格子 */
            .street-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px; flex: 1;
            }
            .street-cell {
                background: rgba(255,255,255,0.05);
                border: 2px solid rgba(255,255,255,0.1);
                border-radius: 12px;
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                cursor: pointer; transition: all 0.2s;
                padding: 10px;
            }
            .street-cell:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.25);
                transform: translateY(-3px);
            }
            .street-cell.disabled {
                opacity: 0.4; cursor: not-allowed;
                transform: none;
            }
            .street-cell .cell-icon {
                font-size: 2em; margin-bottom: 5px;
            }
            .street-cell .cell-name {
                font-size: 0.9em; color: #ccc;
                text-align: center;
            }

            /* === 事件結果彈窗 === */
            .street-event-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 380px; height: 280px;
                display: flex; flex-direction: column;
            }
            .event-dialogue {
                flex: 1; display: flex; flex-direction: column;
                justify-content: center; align-items: center;
                text-align: center; padding: 20px;
            }
            .event-dialogue-text {
                font-size: 1.1em; color: #fff;
                line-height: 1.6; margin-bottom: 15px;
            }
            .event-effects {
                display: flex; flex-wrap: wrap; gap: 8px;
                justify-content: center;
            }
            .event-effect-tag {
                padding: 4px 10px; border-radius: 6px;
                font-size: 0.85em; background: rgba(255,255,255,0.08);
            }
            .event-effect-tag.positive { color: #7ed321; }
            .event-effect-tag.negative { color: #f5576c; }
        `;
        document.head.appendChild(style);
    },

    // === 開啟街道 ===
    open() {
        this._initStyles();

        // 檢查剩餘次數
        if (StreetCore.getRemainingVisits() <= 0) {
            DialogueSystem.showDialogue('PC', '好累回家吧！');
            return;
        }

        let modal = document.getElementById('streetModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'streetModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
    },

    // === 關閉（回到臥室）===
    close() {
        const modal = document.getElementById('streetModal');
        if (modal) modal.classList.remove('show');
    },

    // === 建構街道 Modal ===
    _buildModalHTML() {
        const visits = StreetCore.getRemainingVisits();
        const streetMap = CSVLoader.data.streetMap;

        // 建構 3x3 格子
        let gridHtml = '';
        for (let row = 1; row <= 3; row++) {
            for (let col = 1; col <= 3; col++) {
                const obj = streetMap.find(o => o.row === String(row) && o.col === String(col));
                if (obj) {
                    const disabled = visits <= 0 ? 'disabled' : '';
                    gridHtml += `
                        <div class="street-cell ${disabled}" 
                             onclick="${disabled ? '' : `StreetUI.visitPlace('${obj.obj_id}')`}">
                            <span class="cell-icon">${obj.icon}</span>
                            <span class="cell-name">${obj.name}</span>
                        </div>`;
                } else {
                    gridHtml += `<div class="street-cell disabled"></div>`;
                }
            }
        }

        return `
            <div class="street-modal">
                <div class="modal-title">🚪 街道</div>

                <div class="street-info">
                    <span>選擇要去的地方</span>
                    <span class="street-visits ${visits <= 1 ? 'street-visits-warning' : ''}">
                        剩餘 ${visits} 次
                    </span>
                </div>

                <div class="street-grid">
                    ${gridHtml}
                </div>

                <div class="modal-actions">
                    <button class="modal-btn" onclick="StreetUI.goHome()">回家</button>
                </div>
            </div>`;
    },

    // === 前往地點 ===
    visitPlace(objId) {
        if (StreetCore.getRemainingVisits() <= 0) {
            DialogueSystem.showDialogue('PC', '好累回家吧！');
            this.close();
            return;
        }

        const obj = CSVLoader.getStreetObject(objId);
        if (!obj) return;

        // 消耗次數
        StreetCore.useVisit();

        // 顯示地點對白
        if (obj.comment) {
            DialogueSystem.showDialogue(obj.chara_id || 'PC', obj.comment);
        }

        // 處理不同類型
        switch (obj.action_type) {
            case 'simple_event':
                this._handleSimpleEvent(obj.action_param);
                break;
            case 'open_modal':
                this._handleOpenModal(obj.action_param);
                break;
            default:
                this.open();  // 重新整理街道
        }
    },

    // === 處理簡單事件 ===
    _handleSimpleEvent(eventId) {
        const result = StreetCore.executeSimpleEvent(eventId);

        if (!result.success) {
            showToast(`❌ ${result.message}`);
            this.open();
            return;
        }

        // 顯示事件結果彈窗
        this._showEventResult(result.event, result.effects);
    },

    // === 顯示事件結果 ===
    _showEventResult(event, effects) {
        let modal = document.getElementById('streetEventModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'streetEventModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const effectsHtml = effects.filter(e => !e.stat.includes('FAVOR')).map(e => {
            const text = StreetCore.formatEffect(e.stat, e.value);
            const cls = e.value >= 0 ? 'positive' : 'negative';
            return `<span class="event-effect-tag ${cls}">${text}</span>`;
        }).join('');

        modal.innerHTML = `
            <div class="street-event-modal">
                <div class="modal-title">📍 發生了什麼</div>
                <div class="event-dialogue">
                    <div class="event-dialogue-text">${event.dialogue}</div>
                    <div class="event-effects">${effectsHtml}</div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="StreetUI.closeEventAndContinue()">確定</button>
                </div>
            </div>`;

        modal.classList.add('show');
        updateStatsDisplay();
    },

    // === 關閉事件結果並繼續 ===
    closeEventAndContinue() {
        const modal = document.getElementById('streetEventModal');
        if (modal) modal.classList.remove('show');

        // 檢查是否還有次數
        if (StreetCore.getRemainingVisits() <= 0) {
            DialogueSystem.showDialogue('PC', '好累回家吧！');
            this.close();
        } else {
            this.open();  // 回到街道
        }
    },

    // === 處理開啟 Modal ===
    _handleOpenModal(modalType) {
        this.close();  // 先關街道

        switch (modalType) {
            case 'item_shop_modal':
                StreetShopUI.open();
                break;
            case 'furniture_shop_modal':
                StreetFurnitureUI.open();
                break;
            case 'fortune_modal':
                FortuneUI.open();
                break;
            default:
                showToast(`未知商店: ${modalType}`);
                this.open();
        }
    },

    // === 回家 ===
    goHome() {
        this.close();
        DialogueSystem.showDialogue('PC', '回家囉～');
    },

    // === 從商店返回街道 ===
    returnFromShop() {
        if (StreetCore.getRemainingVisits() <= 0) {
            DialogueSystem.showDialogue('PC', '好累回家吧！');
        } else {
            this.open();
        }
    }
};

window.StreetUI = StreetUI;

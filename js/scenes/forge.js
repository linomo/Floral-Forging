/**
 * ForgeScene - 鍛造室場景管理
 * js/scenes/forge.js
 *
 * 職責：場景渲染、物件點擊分發、確認彈窗
 * 各功能彈窗：DesignUI / CraftingUI / SmeltUI / ForgeUtils / DecorationUI
 */
const ForgeScene = {

    // === 數字轉中文（共用工具）===
    toChineseNumber(num) {
        const d = ['零','壹','貳','參','肆','伍','陸','柒','捌','玖'];
        return d[Math.floor(num / 10)] + d[num % 10];
    },

    // === 確認彈窗樣式 ===
    _initConfirmStyles() {
        if (document.getElementById('forge-confirm-styles')) return;
        const style = document.createElement('style');
        style.id = 'forge-confirm-styles';
        style.textContent = `
            /* === 確認彈窗 === */
            .confirm-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 30px 25px;
                max-width: 300px; width: 90%; text-align: center;
            }
            .confirm-message { font-size: 1.1em; color: #eee; margin-bottom: 20px; line-height: 1.5; }
        `;
        document.head.appendChild(style);
    },

    // === 場景標題（含 EP / 髒髒值）===
    renderHeader() {
        const maxEP     = Math.floor(2 * (player.str + player.int + player.dex) / 3);
        const currentEP = player.currentEP || 0;
        return `
            <span style="font-weight:bold;font-size:1.1em">📍 鍛造室</span>
            <span style="margin-left:15px;color:#888">
                ⚡元氣：<span id="header-ep" style="color:#4ecdc4;font-weight:bold">${currentEP}</span>
                / <span id="header-max-ep">${maxEP}</span>
            </span>
            <span style="margin-left:15px;color:#888">
                💩髒髒值：<span id="header-dirtiness" style="color:#f5576c;font-weight:bold">${player.dirtiness}</span>
            </span>`;
    },

    // === 僅更新標題數值（不重渲場景）===
    updateValues() {
        const maxEP = Math.floor(2 * (player.str + player.int + player.dex) / 3);
        const ep  = document.getElementById('header-ep');
        const mep = document.getElementById('header-max-ep');
        const dir = document.getElementById('header-dirtiness');
        if (ep)  ep.textContent  = player.currentEP || 0;
        if (mep) mep.textContent = maxEP;
        if (dir) dir.textContent = player.dirtiness;
    },

    // === 場景內容（從 forge_map.csv 生成格子）===
    async renderContent() {
        const forgeMap = CSVLoader.data.forgeMap || [];
        if (forgeMap.length === 0) {
            return '<div style="padding:40px;text-align:center;color:#666">載入中...</div>';
        }

        const maxRow = Math.max(...forgeMap.map(o => parseInt(o.row) || 0));
        const maxCol = Math.max(...forgeMap.map(o => parseInt(o.col) || 0));

        let html = `<div class="room-grid" style="grid-template-columns:repeat(${maxCol},80px)">`;
        for (let r = 1; r <= maxRow; r++) {
            for (let c = 1; c <= maxCol; c++) {
                const obj = forgeMap.find(o => parseInt(o.row) === r && parseInt(o.col) === c);
                if (obj && obj.obj_id && obj.obj_id !== 'empty') {
                    html += `
                        <div class="room-item" onclick="ForgeScene.clickRoom('${obj.obj_id}')">
                            <span class="icon">${obj.icon}</span>
                            <span class="label">${obj.name}</span>
                        </div>`;
                } else {
                    html += '<div class="room-item empty"></div>';
                }
            }
        }
        html += '</div>';
        return html;
    },

    // === 完整渲染 ===
    async render() {
        return {
            header:  this.renderHeader(),
            content: await this.renderContent()
        };
    },

    // =========================================
    // === 物件點擊分發
    // =========================================
    clickRoom(objId) {
        const obj = CSVLoader.getForgeObject(objId);
        if (!obj) { console.error(`找不到物件: ${objId}`); return; }

        switch (obj.action_type) {
            case 'open_modal':   this._handleOpenModal(obj);   break;
            case 'dialogue':     this._handleDialogue(obj);    break;
            case 'clean_room':   this._handleCleanRoom(obj);   break;
            case 'confirm_exit': this._handleConfirmExit(obj); break;
            default: console.warn(`未知動作類型: ${obj.action_type}`);
        }
    },

    _handleOpenModal(obj) {
        if (obj.comment) DialogueSystem.showDialogue(obj.chara_id, obj.comment);
        switch (obj.action_param) {
            case 'design_modal':     DesignUI.open();                break;
            case 'forge_modal':      CraftingUI.open();              break;
            case 'smelt_modal':      SmeltUI.open();                 break;
            case 'book_modal':       ForgeUtils.openBookModal();     break;
            case 'inventory_modal':  ForgeUtils.openInventory();     break;
            case 'decoration_modal':  DecorationUI.open();             break;
            case 'commission_modal':  CommissionUI.open();             break;
            default: console.warn(`未知 modal: ${obj.action_param}`);
        }
    },

    _handleDialogue(obj) {
        if (obj.comment) DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    },

    _handleCleanRoom(obj) {
        const epCost = parseInt(obj.ep_cost) || 0;
        if (obj.comment) DialogueSystem.showDialogue(obj.chara_id, obj.comment);
        ForgeUtils.cleanRoom(epCost);
    },

    _handleConfirmExit(obj) {
        const msg     = obj.confirm_message || '確定要離開嗎？';
        const buttons = obj.confirm_buttons ? obj.confirm_buttons.split('│') : ['確定', '取消'];
        this.openConfirmModal(msg, buttons[0], buttons[1], () => {
            showToast('離開鍛造室...');
        });
    },

    // =========================================
    // === 確認彈窗
    // =========================================
    openConfirmModal(message, confirmText, cancelText, onConfirm) {
        this._initConfirmStyles();

        let modal = document.getElementById('confirmModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'confirmModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="confirm-modal">
                <div class="confirm-message">${message}</div>
                <div class="modal-actions">
                    <button class="modal-btn" id="cancelBtn">${cancelText}</button>
                    <button class="modal-btn primary" id="confirmBtn">${confirmText}</button>
                </div>
            </div>`;

        document.getElementById('confirmBtn').addEventListener('click', () => {
            this.closeConfirmModal();
            if (onConfirm) onConfirm();
        });
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        modal.classList.add('show');
    },

    closeConfirmModal() {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.classList.remove('show');
    }
};

window.ForgeScene = ForgeScene;

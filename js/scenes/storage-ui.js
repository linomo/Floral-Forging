/**
 * StorageUI - 儲物櫃彈窗
 * js/scenes/storage-ui.js
 */
const StorageUI = {

    _initStyles() {
        if (document.getElementById('storage-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'storage-system-styles';
        style.textContent = `
            /* === 儲物櫃 Modal === */
            .storage-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 400px; width: 90%; max-height: 80vh; overflow-y: auto;
            }
            
            /* 目前裝備區 */
            .storage-current {
                background: rgba(0,0,0,0.3);
                border-radius: 10px; padding: 15px;
                margin-bottom: 15px; text-align: center;
            }
            .storage-current-title {
                font-size: 0.85em; color: #888; margin-bottom: 10px;
            }
            .storage-current-item {
                display: flex; align-items: center; justify-content: center;
                gap: 10px;
            }
            .storage-current-icon {
                font-size: 2em;
            }
            .storage-current-info {
                text-align: left;
            }
            .storage-current-name {
                font-weight: bold; color: #fff; font-size: 1.1em;
            }
            .storage-current-effect {
                font-size: 0.85em; color: #7ed321; margin-top: 3px;
            }
            .storage-current-empty {
                color: #666; font-size: 0.95em;
            }
            
            /* 卸下按鈕 */
            .storage-unequip-btn {
                margin-top: 10px; padding: 6px 15px;
                background: rgba(245, 87, 108, 0.2);
                border: 1px solid #f5576c;
                border-radius: 6px; color: #f5576c;
                cursor: pointer; font-size: 0.8em; font-family: inherit;
            }
            .storage-unequip-btn:hover {
                background: rgba(245, 87, 108, 0.3);
            }
            
            /* 物品列表 */
            .storage-list-title {
                font-size: 0.9em; color: #888; margin-bottom: 10px;
                padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            .storage-list {
                display: flex; flex-direction: column; gap: 8px;
                max-height: 300px; overflow-y: auto;
            }
            .storage-item {
                display: flex; align-items: center; gap: 12px;
                padding: 12px; background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px; cursor: pointer;
                transition: all 0.2s;
            }
            .storage-item:hover {
                background: rgba(255,255,255,0.08);
                border-color: rgba(255,255,255,0.15);
                transform: translateX(3px);
            }
            .storage-item-icon {
                font-size: 1.8em; width: 45px; text-align: center;
            }
            .storage-item-info {
                flex: 1;
            }
            .storage-item-name {
                font-weight: bold; color: #fff; font-size: 0.95em;
            }
            .storage-item-effect {
                font-size: 0.8em; color: #ccc; margin-top: 3px;
            }
            .storage-item-desc {
                font-size: 0.75em; color: #666; margin-top: 3px;
            }
            .storage-item-btn {
                padding: 6px 12px;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border: none; border-radius: 6px;
                color: #fff; cursor: pointer; font-size: 0.8em;
                font-family: inherit;
            }
            .storage-item-btn:hover {
                transform: scale(1.05);
            }
            
            /* 空列表 */
            .storage-empty {
                text-align: center; padding: 30px;
                color: #666; font-size: 0.9em;
            }
        `;
        document.head.appendChild(style);
    },

    // === 開啟儲物櫃 ===
    open() {
        this._initStyles();

        let modal = document.getElementById('storageModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'storageModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('storageModal');
        if (modal) modal.classList.remove('show');
    },

    // === 建構 Modal HTML ===
    _buildModalHTML() {
        const currentEquip = EquipmentCore.getCurrentEquipment();
        const unequipped = EquipmentCore.getUnequippedItems();

        return `
            <div class="storage-modal">
                <div class="modal-title">📦 儲物櫃</div>
                
                <!-- 目前裝備 -->
                <div class="storage-current">
                    <div class="storage-current-title">目前裝備</div>
                    ${currentEquip ? this._buildCurrentEquip(currentEquip) : '<div class="storage-current-empty">— 沒有裝備任何東西 —</div>'}
                </div>
                
                <!-- 物品列表 -->
                <div class="storage-list-title">📋 倉庫物品 (${unequipped.length})</div>
                ${unequipped.length > 0 
                    ? `<div class="storage-list">${unequipped.map(e => this._buildItemRow(e)).join('')}</div>`
                    : '<div class="storage-empty">倉庫空空的～</div>'
                }
                
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="StorageUI.close()">關閉</button>
                </div>
            </div>`;
    },

    // === 建構目前裝備顯示 ===
    _buildCurrentEquip(equip) {
        const effectText = EquipmentCore.formatEffect(equip.effect_sta, parseInt(equip.effect_value) || 0);
        
        return `
            <div class="storage-current-item">
                <span class="storage-current-icon">${equip.icon}</span>
                <div class="storage-current-info">
                    <div class="storage-current-name">${equip.name}</div>
                    <div class="storage-current-effect">${effectText}</div>
                </div>
            </div>
            <button class="storage-unequip-btn" onclick="StorageUI.unequip()">卸下裝備</button>`;
    },

    // === 建構物品列 ===
    _buildItemRow(equip) {
        const effectText = EquipmentCore.formatEffect(equip.effect_sta, parseInt(equip.effect_value) || 0);
        const desc = equip.description || '';
        
        return `
            <div class="storage-item">
                <span class="storage-item-icon">${equip.icon}</span>
                <div class="storage-item-info">
                    <div class="storage-item-name">${equip.name}</div>
                    <div class="storage-item-effect">${effectText}</div>
                    ${desc ? `<div class="storage-item-desc">${desc}</div>` : ''}
                </div>
                <button class="storage-item-btn" onclick="StorageUI.equip('${equip.equipment_id}')">裝備</button>
            </div>`;
    },

    // === 裝備 ===
    equip(equipmentId) {
        const result = EquipmentCore.equip(equipmentId);
        
        if (result.success) {
            showToast(result.message);
            updateStatsDisplay();
            this._updateLeftPanelEquip();
            this.open();  // 重新渲染
        } else {
            showToast(`❌ ${result.message}`);
        }
    },

    // === 卸下 ===
    unequip() {
        const result = EquipmentCore.unequip();
        
        if (result.success) {
            showToast(result.message);
            updateStatsDisplay();
            this._updateLeftPanelEquip();
            this.open();  // 重新渲染
        } else {
            showToast(`❌ ${result.message}`);
        }
    },

    // === 更新左側面板裝備欄 ===
    _updateLeftPanelEquip() {
        const slot = document.querySelector('.equip-slot');
        if (!slot) return;

        const equip = EquipmentCore.getCurrentEquipment();
        
        if (equip) {
            const effectText = EquipmentCore.formatEffect(equip.effect_sta, parseInt(equip.effect_value) || 0);
            slot.innerHTML = `
                <span class="equip-icon">${equip.icon}</span>
                <span class="equip-name">${equip.name}</span>
                <span class="equip-effect">${effectText}</span>`;
        } else {
            slot.innerHTML = `
                <span class="equip-icon">➖</span>
                <span class="equip-name">無裝備</span>
                <span class="equip-effect"></span>`;
        }
    }
};

window.StorageUI = StorageUI;

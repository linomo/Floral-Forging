/**
 * FurnitureUI - 家具彈窗
 * js/scenes/furniture-ui.js
 */
const FurnitureUI = {
    currentObjId: null,  // 當前操作的位置

    _initStyles() {
        if (document.getElementById('furniture-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'furniture-system-styles';
        style.textContent = `
            /* === 家具 Modal === */
            .furniture-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 400px; width: 90%; max-height: 70vh; overflow-y: auto;
            }
            
            /* 家具列表 */
            .furniture-list {
                display: flex; flex-direction: column; gap: 10px;
                margin: 15px 0; max-height: 300px; overflow-y: auto;
            }
            .furniture-item {
                padding: 12px 15px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 10px; cursor: pointer; transition: all 0.2s;
                display: flex; align-items: center; gap: 12px;
            }
            .furniture-item:hover {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }
            .furniture-item-icon { font-size: 1.8em; }
            .furniture-item-info { flex: 1; }
            .furniture-item-name { font-weight: bold; color: #f5a623; margin-bottom: 3px; }
            .furniture-item-effect { font-size: 0.85em; color: #ccc; }
            .furniture-item-cost { font-size: 0.8em; color: #ccc; }
            .furniture-empty {
                text-align: center; color: #555; padding: 30px 0; font-size: 0.9em;
            }
            
            /* 家具詳情 */
            .furniture-detail {
                text-align: center; padding: 20px;
                background: rgba(0,0,0,0.2); border-radius: 12px; margin-bottom: 15px;
            }
            .furniture-detail-icon { font-size: 3em; margin-bottom: 10px; }
            .furniture-detail-name { font-size: 1.3em; font-weight: bold; color: #f5a623; margin-bottom: 8px; }
            .furniture-detail-effect {
                font-size: 1em; color: #7ed321;
                padding: 8px 15px;
                background: rgba(126, 211, 33, 0.1);
                border-radius: 8px; display: inline-block; margin-bottom: 8px;
            }
            .furniture-detail-cost { font-size: 0.9em; color: #f5576c; }
            
            /* 按鈕 */
            .furniture-btn {
                width: 100%; padding: 12px; font-size: 1em;
                background: linear-gradient(90deg, #f093fb, #f5576c);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                font-family: inherit; transition: all 0.2s; margin-bottom: 10px;
            }
            .furniture-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245, 87, 108, 0.3);
            }
            .furniture-btn.secondary {
                background: rgba(255,255,255,0.1);
            }
            .furniture-btn.danger {
                background: linear-gradient(90deg, #f5576c, #ff6b6b);
            }
        `;
        document.head.appendChild(style);
    },

    // =========================================
    // === 放置家具彈窗（點擊空格）
    // =========================================
    openPlaceModal(objId) {
        this._initStyles();
        this.currentObjId = objId;

        let modal = document.getElementById('furnitureModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'furnitureModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const unplacedList = FurnitureCore.getUnplacedFurniture();
        
        let listHtml = '';
        if (unplacedList.length === 0) {
            listHtml = '<div class="furniture-empty">沒有可放置的家具...</div>';
        } else {
            listHtml = unplacedList.map(f => {
                const effectText = FurnitureCore.formatEffect(f.effect_sta, parseInt(f.effect_value));
                return `
                    <div class="furniture-item" onclick="FurnitureUI.placeFurniture('${f.furniture_id}')">
                        <span class="furniture-item-icon">${f.icon}</span>
                        <div class="furniture-item-info">
                            <div class="furniture-item-name">${f.name}</div>
                            <div class="furniture-item-effect">${effectText}</div>
                            <div class="furniture-item-cost">維護費 ${parseInt(f.maintenance) || 0}元/旬</div>
                        </div>
                    </div>`;
            }).join('');
        }

        modal.innerHTML = `
            <div class="furniture-modal">
                <div class="modal-title">🛋️ 放置家具</div>
                <div class="furniture-list">${listHtml}</div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="FurnitureUI.close()">取消</button>
                </div>
            </div>`;

        modal.classList.add('show');
    },

    // === 執行放置 ===
    placeFurniture(furnitureId) {
        if (!this.currentObjId) return;

        const success = FurnitureCore.placeFurniture(this.currentObjId, furnitureId);
        if (success) {
            const furniture = CSVLoader.getFurniture(furnitureId);
            showToast(`🛋️ 放置了 ${furniture ? furniture.name : '家具'}！`);
            DialogueSystem.showDialogue('PC', `${furniture ? furniture.icon : '📦'} 放好了！房間超讚讚！`);
            this.close();
            renderScene();  // 重新渲染場景
            updateStatsDisplay();
        } else {
            showToast('❌ 放置失敗！');
        }
    },

    // =========================================
    // === 家具詳情彈窗（點擊已放置的家具）
    // =========================================
    openFurnitureDetail(objId, furnitureId) {
        this._initStyles();
        this.currentObjId = objId;

        const furniture = CSVLoader.getFurniture(furnitureId);
        if (!furniture) return;

        let modal = document.getElementById('furnitureModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'furnitureModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const effectText = FurnitureCore.formatEffect(furniture.effect_sta, parseInt(furniture.effect_value));

        modal.innerHTML = `
            <div class="furniture-modal">
                <div class="modal-title">🛋️ 家具詳情</div>
                <div class="furniture-detail">
                    <div class="furniture-detail-icon">${furniture.icon}</div>
                    <div class="furniture-detail-name">${furniture.name}</div>
                    <div class="furniture-detail-effect">${effectText}</div>
                    <div class="furniture-item-cost">維護費 ${parseInt(furniture.maintenance) || 0}元/旬</div>
                </div>
                <button class="furniture-btn secondary" onclick="FurnitureUI.openMoveModal('${furnitureId}')">
                    🔄 移動位置
                </button>
                <button class="furniture-btn danger" onclick="FurnitureUI.removeFurniture()">
                    📦 收回倉庫
                </button>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="FurnitureUI.close()">關閉</button>
                </div>
            </div>`;

        modal.classList.add('show');
    },

    // === 移除家具（收回倉庫）===
    removeFurniture() {
        if (!this.currentObjId) return;

        const furnitureId = player.placedFurniture[this.currentObjId];
        const furniture = CSVLoader.getFurniture(furnitureId);
        
        const success = FurnitureCore.removeFurniture(this.currentObjId);
        if (success) {
            showToast(`📦 ${furniture ? furniture.name : '家具'} 收回倉庫了！`);
            DialogueSystem.showDialogue('PC', '先收起來，之後再放～');
            this.close();
            renderScene();
            updateStatsDisplay();
        }
    },

    // === 移動家具（選擇新位置）===
    openMoveModal(furnitureId) {
        // 取得所有空位
        const bedroomMap = CSVLoader.data.bedroomMap || [];
        const emptySlots = bedroomMap.filter(obj => {
            if (obj.action_type !== 'place_furniture') return false;
            if (obj.unlock === 'expanded' && !player.roomExpanded) return false;
            if (player.placedFurniture[obj.obj_id]) return false;  // 已有家具
            return true;
        });

        if (emptySlots.length === 0) {
            showToast('❌ 沒有空位可以移動！');
            return;
        }

        const modal = document.getElementById('furnitureModal');
        const furniture = CSVLoader.getFurniture(furnitureId);
        
        modal.innerHTML = `
            <div class="furniture-modal">
                <div class="modal-title">🔄 選擇新位置</div>
                <div class="furniture-detail" style="padding:15px">
                    <span style="font-size:2em">${furniture ? furniture.icon : '📦'}</span>
                    <div style="margin-top:8px;color:#ccc">${furniture ? furniture.name : '家具'}</div>
                </div>
                <div class="furniture-list">
                    ${emptySlots.map(slot => `
                        <div class="furniture-item" onclick="FurnitureUI.moveTo('${slot.obj_id}', '${furnitureId}')">
                            <span class="furniture-item-icon">📍</span>
                            <div class="furniture-item-info">
                                <div class="furniture-item-name">${slot.obj_id}</div>
                                <div class="furniture-item-effect">第${slot.row}排 第${slot.col}欄</div>
                            </div>
                        </div>`).join('')}
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="FurnitureUI.openFurnitureDetail('${this.currentObjId}', '${furnitureId}')">返回</button>
                </div>
            </div>`;
    },

    // === 執行移動 ===
    moveTo(newObjId, furnitureId) {
        // 從原位置移除
        FurnitureCore.removeFurniture(this.currentObjId);
        // 放到新位置
        FurnitureCore.placeFurniture(newObjId, furnitureId);
        
        const furniture = CSVLoader.getFurniture(furnitureId);
        showToast(`🔄 ${furniture ? furniture.name : '家具'} 移動完成！`);
        DialogueSystem.showDialogue('PC', '換個位置，感覺煥然一新！');
        this.close();
        renderScene();
        updateStatsDisplay();
    },

    // === 關閉彈窗 ===
    close() {
        const modal = document.getElementById('furnitureModal');
        if (modal) modal.classList.remove('show');
        this.currentObjId = null;
    }
};

window.FurnitureUI = FurnitureUI;

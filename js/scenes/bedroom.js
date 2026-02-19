/**
 * BedroomScene - 臥室場景管理
 * js/scenes/bedroom.js
 */
const BedroomScene = {

    // === 場景標題 ===
    renderHeader() {
        const expandStatus = player.roomExpanded ? '（已擴建）' : '';
        return `
            <span style="font-weight:bold;font-size:1.1em">🏠 小哈的房間 ${expandStatus}</span>
            <span style="margin-left:15px;color:#888">
                🛋️ 家具：<span style="color:#f5a623;font-weight:bold">${this._countPlacedFurniture()}</span> 個
            </span>`;
    },

    // === 計算已放置家具數量 ===
    _countPlacedFurniture() {
        return Object.keys(player.placedFurniture).length;
    },

    // === 僅更新標題數值 ===
    updateValues() {
        // 未來可在此更新動態數值
    },

    // === 場景內容（從 bedroom_map.csv 生成格子）===
    async renderContent() {
        const bedroomMap = CSVLoader.data.bedroomMap || [];
        if (bedroomMap.length === 0) {
            return '<div style="padding:40px;text-align:center;color:#666">載入中...</div>';
        }

        const maxRow = Math.max(...bedroomMap.map(o => parseInt(o.row) || 0));
        const maxCol = Math.max(...bedroomMap.map(o => parseInt(o.col) || 0));

        let html = `<div class="room-grid" style="grid-template-columns:repeat(${maxCol},80px)">`;
        for (let r = 1; r <= maxRow; r++) {
            for (let c = 1; c <= maxCol; c++) {
                const obj = bedroomMap.find(o => parseInt(o.row) === r && parseInt(o.col) === c);
                
                if (!obj || !obj.obj_id) {
                    html += '<div class="room-item empty"></div>';
                    continue;
                }

                // 檢查是否為擴建區域且尚未擴建
                if (obj.unlock === 'expanded' && !player.roomExpanded) {
                    html += `
                        <div class="room-item" style="opacity:0.3;cursor:not-allowed">
                            <span class="icon">🔒</span>
                            <span class="label">擴建</span>
                        </div>`;
                    continue;
                }

                // 檢查是否為可放置家具的空格
                if (obj.action_type === 'place_furniture') {
                    const placedId = player.placedFurniture[obj.obj_id];
                    if (placedId) {
                        // 已放置家具
                        const furniture = CSVLoader.getFurniture(placedId);
                        html += `
                            <div class="room-item" onclick="BedroomScene.clickFurniture('${obj.obj_id}')">
                                <span class="icon">${furniture ? furniture.icon : '📦'}</span>
                                <span class="label">${furniture ? furniture.name.slice(0, 4) : '家具'}</span>
                            </div>`;
                    } else {
                        // 空格
                        html += `
                            <div class="room-item" style="border-style:dashed" onclick="BedroomScene.clickEmpty('${obj.obj_id}')">
                                <span class="icon" style="opacity:0.3">➕</span>
                                <span class="label" style="opacity:0.5">空位</span>
                            </div>`;
                    }
                    continue;
                }

                // 固定物件
                html += `
                    <div class="room-item" onclick="BedroomScene.clickRoom('${obj.obj_id}')">
                        <span class="icon">${obj.icon}</span>
                        <span class="label">${obj.name}</span>
                    </div>`;
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
        const obj = CSVLoader.getBedroomObject(objId);
        if (!obj) { console.error(`找不到物件: ${objId}`); return; }

        switch (obj.action_type) {
            case 'open_modal':   this._handleOpenModal(obj);   break;
            case 'dialogue':     this._handleDialogue(obj);    break;
            default: console.warn(`未知動作類型: ${obj.action_type}`);
        }
    },

    // 點擊已放置的家具
    clickFurniture(objId) {
        const furnitureId = player.placedFurniture[objId];
        if (!furnitureId) return;
        
        const furniture = CSVLoader.getFurniture(furnitureId);
        if (!furniture) return;

        FurnitureUI.openFurnitureDetail(objId, furnitureId);
    },

    // 點擊空格（放置家具）
    clickEmpty(objId) {
        FurnitureUI.openPlaceModal(objId);
    },

    _handleOpenModal(obj) {
        if (obj.comment) DialogueSystem.showDialogue(obj.chara_id, obj.comment);
        
        switch (obj.action_param) {
            case 'bank_modal':
                BankUI.open();
                break;
            case 'calendar_modal':
                showToast('📅 行事曆功能開發中...');
                DialogueSystem.showDialogue('PC', '下一旬要做什麼呢？');
                break;
            case 'bed_modal':
                showToast('🛏️ 床功能開發中...');
                DialogueSystem.showDialogue('PC', '好想睡覺喔～');
                break;
            case 'dress_modal':
                StorageUI.open();
                break;
            case 'street_modal':
                showToast('🚪 街道功能開發中...');
                DialogueSystem.showDialogue('PC', '出去逛逛囉！');
                break;
            default:
                console.warn(`未知 modal: ${obj.action_param}`);
        }
    },

    _handleDialogue(obj) {
        if (obj.comment) DialogueSystem.showDialogue(obj.chara_id, obj.comment);
    }
};

window.BedroomScene = BedroomScene;

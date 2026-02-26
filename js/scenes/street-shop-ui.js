/**
 * StreetShopUI - 廣場物品商店（裝備+禮品）
 * js/scenes/street-shop-ui.js
 */
const StreetShopUI = {

    _initStyles() {
        if (document.getElementById('street-shop-styles')) return;
        const style = document.createElement('style');
        style.id = 'street-shop-styles';
        style.textContent = `
            /* === 物品商店 Modal === */
            .item-shop-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 450px; height: 550px;
                display: flex; flex-direction: column;
            }

            /* 分頁標籤 */
            .shop-tabs {
                display: flex; gap: 10px; margin-bottom: 15px;
            }
            .shop-tab {
                flex: 1; padding: 10px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; cursor: pointer;
                text-align: center; color: #888;
                font-family: inherit; transition: all 0.2s;
            }
            .shop-tab:hover {
                background: rgba(255,255,255,0.1);
            }
            .shop-tab.active {
                background: linear-gradient(90deg, #f5a623, #f5576c);
                border-color: #f5a623; color: #fff;
            }

            /* 折扣資訊 */
            .shop-discount {
                background: rgba(0,0,0,0.3);
                border-radius: 8px; padding: 8px 12px;
                margin-bottom: 10px; font-size: 0.85em;
                color: #7ed321; text-align: center;
            }

            /* 商品列表 */
            .shop-list {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: 8px;
            }
            .shop-item {
                display: flex; align-items: center; gap: 12px;
                padding: 12px; background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
            }
            .shop-item.owned {
                opacity: 0.5;
            }
            .shop-item-icon { font-size: 1.8em; width: 45px; text-align: center; }
            .shop-item-info { flex: 1; }
            .shop-item-name { font-weight: bold; color: #fff; font-size: 0.95em; }
            .shop-item-effect { font-size: 0.8em; color: #ccc; margin-top: 3px; }
            .shop-item-desc { font-size: 0.75em; color: #666; margin-top: 3px; }
            .shop-item-price {
                display: flex; flex-direction: column; align-items: flex-end;
            }
            .shop-item-original {
                font-size: 0.75em; color: #888;
                text-decoration: line-through;
            }
            .shop-item-final {
                font-size: 1em; color: #f5a623; font-weight: bold;
            }
            .shop-item-btn {
                padding: 6px 12px;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border: none; border-radius: 6px;
                color: #fff; cursor: pointer; font-size: 0.8em;
                font-family: inherit; margin-top: 5px;
            }
            .shop-item-btn:hover { transform: scale(1.05); }
            .shop-item-btn:disabled {
                opacity: 0.5; cursor: not-allowed; transform: none;
            }
            .shop-item-owned {
                font-size: 0.8em; color: #7ed321; margin-top: 5px;
            }

            /* === 禮品紙條彈窗 === */
            .gift-note-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 350px; height: 280px;
                display: flex; flex-direction: column;
            }
            .gift-note-content {
                flex: 1; display: flex; flex-direction: column;
                justify-content: center; align-items: center;
                text-align: center; padding: 20px;
            }
            .gift-note-label {
                font-size: 0.9em; color: #888; margin-bottom: 10px;
            }
            .gift-note-text {
                font-size: 1em; color: #fff; line-height: 1.6;
                background: rgba(255,255,255,0.05);
                border-radius: 8px; padding: 15px;
            }
        `;
        document.head.appendChild(style);
    },

    currentTab: 'equipment',

    // === 開啟商店 ===
    open() {
        this._initStyles();

        let modal = document.getElementById('itemShopModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'itemShopModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('itemShopModal');
        if (modal) modal.classList.remove('show');
        StreetUI.returnFromShop();
    },

    // === 切換分頁 ===
    switchTab(tab) {
        this.currentTab = tab;
        this.open();  // 重新渲染
    },

    // === 建構 Modal ===
    _buildModalHTML() {
        const sunFavor = player.favor.sunstreet || 0;
        const moonFavor = player.favor.moonstreet || 0;

        const discountText = this.currentTab === 'equipment'
            ? `日街好感 ${sunFavor}% → 裝備折扣 ${sunFavor}%`
            : `月街好感 ${moonFavor}% → 禮品折扣 ${moonFavor}%`;

        return `
            <div class="item-shop-modal">
                <div class="modal-title">⬜ 廣場 - 物品商店</div>

                <!-- 分頁 -->
                <div class="shop-tabs">
                    <button class="shop-tab ${this.currentTab === 'equipment' ? 'active' : ''}"
                            onclick="StreetShopUI.switchTab('equipment')">
                        🎒 裝備
                    </button>
                    <button class="shop-tab ${this.currentTab === 'gift' ? 'active' : ''}"
                            onclick="StreetShopUI.switchTab('gift')">
                        🎁 禮品
                    </button>
                </div>

                <!-- 折扣資訊 -->
                <div class="shop-discount">💰 ${discountText}</div>

                <!-- 商品列表 -->
                <div class="shop-list">
                    ${this.currentTab === 'equipment' ? this._buildEquipmentList() : this._buildGiftList()}
                </div>

                <div class="modal-actions">
                    <button class="modal-btn" onclick="StreetShopUI.close()">離開</button>
                </div>
            </div>`;
    },

    // === 建構裝備列表 ===
    _buildEquipmentList() {
        const equipments = CSVLoader.data.equipment.filter(e => e.source === 'sellman');
        
        if (equipments.length === 0) {
            return '<div style="text-align:center;color:#666;padding:20px">沒有商品</div>';
        }

        return equipments.map(equip => {
            const owned = player.ownedEquipment.includes(equip.equipment_id);
            const originalPrice = parseInt(equip.price) || 0;
            const finalPrice = StreetCore.calcEquipmentPrice(originalPrice);
            const effectText = EquipmentCore.formatEffect(equip.effect_sta, parseInt(equip.effect_value) || 0);
            const canBuy = !owned && player.money >= finalPrice;

            return `
                <div class="shop-item ${owned ? 'owned' : ''}">
                    <span class="shop-item-icon">${equip.icon}</span>
                    <div class="shop-item-info">
                        <div class="shop-item-name">${equip.name}</div>
                        <div class="shop-item-effect">${effectText}</div>
                        ${equip.description ? `<div class="shop-item-desc">${equip.description}</div>` : ''}
                    </div>
                    <div class="shop-item-price">
                        ${originalPrice !== finalPrice ? `<span class="shop-item-original">${originalPrice}</span>` : ''}
                        <span class="shop-item-final">${finalPrice} 元</span>
                        ${owned 
                            ? '<span class="shop-item-owned">✓ 已擁有</span>'
                            : `<button class="shop-item-btn" ${canBuy ? '' : 'disabled'}
                                       onclick="StreetShopUI.buyEquipment('${equip.equipment_id}')">購買</button>`
                        }
                    </div>
                </div>`;
        }).join('');
    },

    // === 建構禮品列表 ===
    _buildGiftList() {
        const basePrice = 1000;
        const finalPrice = StreetCore.calcGiftPrice(basePrice);
        const canBuy = player.money >= finalPrice;

        const gifts = [
            { id: 'SF', name: '🎁 給師父的禮物', target: '師父' },
            { id: 'SS', name: '🎁 給小師兄的禮物', target: '小師兄' },
            { id: 'DS', name: '🎁 給大俠的禮物', target: '大俠' }
        ];

        return gifts.map(gift => `
            <div class="shop-item">
                <span class="shop-item-icon">🎁</span>
                <div class="shop-item-info">
                    <div class="shop-item-name">給${gift.target}的禮物</div>
                    <div class="shop-item-effect">直接幫你送到府！</div>
                </div>
                <div class="shop-item-price">
                    ${basePrice !== finalPrice ? `<span class="shop-item-original">${basePrice}</span>` : ''}
                    <span class="shop-item-final">${finalPrice} 元</span>
                    <button class="shop-item-btn" ${canBuy ? '' : 'disabled'}
                            onclick="StreetShopUI.buyGift('${gift.id}')">購買</button>
                </div>
            </div>`
        ).join('');
    },

    // === 購買裝備 ===
    buyEquipment(equipmentId) {
        const result = StreetCore.buyEquipment(equipmentId);

        if (result.success) {
            showToast(result.message);
            updateStatsDisplay();
            this.open();  // 重新渲染
        } else {
            showToast(`❌ ${result.message}`);
        }
    },

    // === 購買禮品 ===
    buyGift(targetId) {
        const result = StreetCore.buyAndSendGift(targetId);

        if (!result.success) {
            showToast(`❌ ${result.message}`);
            return;
        }

        updateStatsDisplay();
        
        // 顯示紙條
        this._showGiftNote(result.note);
    },

    // === 顯示禮品紙條 ===
    _showGiftNote(noteText) {
        let modal = document.getElementById('giftNoteModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'giftNoteModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="gift-note-modal">
                <div class="modal-title">📜 收到紙條</div>
                <div class="gift-note-content">
                    <div class="gift-note-label">店家：「直接幫你送到府！」</div>
                    <div class="gift-note-text">${noteText}</div>
                </div>
                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="StreetShopUI.closeGiftNote()">確定</button>
                </div>
            </div>`;

        modal.classList.add('show');

        // 關閉商店 Modal
        const shopModal = document.getElementById('itemShopModal');
        if (shopModal) shopModal.classList.remove('show');
    },

    // === 關閉紙條並離開 ===
    closeGiftNote() {
        const modal = document.getElementById('giftNoteModal');
        if (modal) modal.classList.remove('show');

        DialogueSystem.showDialogue('PC', '不知道他們喜不喜歡？');
        showToast('今天花的錢夠多了！');
        
        StreetUI.returnFromShop();
    }
};

window.StreetShopUI = StreetShopUI;

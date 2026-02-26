/**
 * StreetFurnitureUI - 家具商店
 * js/scenes/street-furniture-ui.js
 */
const StreetFurnitureUI = {

    _initStyles() {
        if (document.getElementById('street-furniture-styles')) return;
        const style = document.createElement('style');
        style.id = 'street-furniture-styles';
        style.textContent = `
            /* === 家具商店 Modal === */
            .furniture-shop-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 450px; height: 550px;
                display: flex; flex-direction: column;
            }

            /* 折扣資訊 */
            .furniture-shop-discount {
                background: rgba(0,0,0,0.3);
                border-radius: 8px; padding: 8px 12px;
                margin-bottom: 10px; font-size: 0.85em;
                color: #7ed321; text-align: center;
            }

            /* 家具列表 */
            .furniture-shop-list {
                flex: 1; overflow-y: auto;
                display: flex; flex-direction: column; gap: 8px;
            }
            .furniture-shop-item {
                display: flex; align-items: center; gap: 12px;
                padding: 12px; background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
            }
            .furniture-shop-item.owned { opacity: 0.5; }
            .furniture-shop-item-icon { font-size: 1.8em; width: 45px; text-align: center; }
            .furniture-shop-item-info { flex: 1; }
            .furniture-shop-item-name { font-weight: bold; color: #fff; font-size: 0.95em; }
            .furniture-shop-item-effect { font-size: 0.8em; color: #ccc; margin-top: 3px; }
            .furniture-shop-item-maintenance { font-size: 0.75em; color: #888; margin-top: 2px; }
            .furniture-shop-item-price {
                display: flex; flex-direction: column; align-items: flex-end;
            }
            .furniture-shop-item-original {
                font-size: 0.75em; color: #888;
                text-decoration: line-through;
            }
            .furniture-shop-item-final {
                font-size: 1em; color: #f5a623; font-weight: bold;
            }
            .furniture-shop-item-btn {
                padding: 6px 12px;
                background: linear-gradient(90deg, #4ecdc4, #44a08d);
                border: none; border-radius: 6px;
                color: #fff; cursor: pointer; font-size: 0.8em;
                font-family: inherit; margin-top: 5px;
            }
            .furniture-shop-item-btn:hover { transform: scale(1.05); }
            .furniture-shop-item-btn:disabled {
                opacity: 0.5; cursor: not-allowed; transform: none;
            }
            .furniture-shop-item-owned {
                font-size: 0.8em; color: #7ed321; margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    },

    // === 開啟家具商店 ===
    open() {
        this._initStyles();

        let modal = document.getElementById('furnitureShopModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'furnitureShopModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        modal.classList.add('show');
    },

    // === 關閉 ===
    close() {
        const modal = document.getElementById('furnitureShopModal');
        if (modal) modal.classList.remove('show');
        StreetUI.returnFromShop();
    },

    // === 建構 Modal ===
    _buildModalHTML() {
        const starFavor = player.favor.starstreet || 0;

        return `
            <div class="furniture-shop-modal">
                <div class="modal-title">🏬 商店 - 家具</div>

                <!-- 折扣資訊 -->
                <div class="furniture-shop-discount">
                    💰 星街好感 ${starFavor}% → 家具折扣 ${starFavor}%
                </div>

                <!-- 家具列表 -->
                <div class="furniture-shop-list">
                    ${this._buildFurnitureList()}
                </div>

                <div class="modal-actions">
                    <button class="modal-btn" onclick="StreetFurnitureUI.close()">離開</button>
                </div>
            </div>`;
    },

    // === 建構家具列表 ===
    _buildFurnitureList() {
        const furnitures = CSVLoader.data.furniture.filter(f => f.source === 'sellman');
        
        if (furnitures.length === 0) {
            return '<div style="text-align:center;color:#666;padding:20px">沒有商品</div>';
        }

        return furnitures.map(furniture => {
            const owned = player.ownedFurniture.includes(furniture.furniture_id);
            const originalPrice = parseInt(furniture.price) || 0;
            const finalPrice = StreetCore.calcFurniturePrice(originalPrice);
            const maintenance = parseInt(furniture.maintenance) || 0;
            const canBuy = !owned && player.money >= finalPrice;

            // 效果顯示
            let effectText = '';
            if (furniture.effect_sta && furniture.effect_value) {
                const value = parseInt(furniture.effect_value) || 0;
                const sign = value >= 0 ? '+' : '';
                const nameMap = {
                    'STR': '力量', 'INT': '智力', 'DEX': '敏捷',
                    'MOOD': '心情', 'STRESS': '壓力',
                    'CURRENTEP': '元氣', 'currentEP': '元氣'
                };
                const statLabel = nameMap[furniture.effect_sta] || furniture.effect_sta;
                effectText = `${statLabel} ${sign}${value}`;
            }

            return `
                <div class="furniture-shop-item ${owned ? 'owned' : ''}">
                    <span class="furniture-shop-item-icon">${furniture.icon}</span>
                    <div class="furniture-shop-item-info">
                        <div class="furniture-shop-item-name">${furniture.name}</div>
                        ${effectText ? `<div class="furniture-shop-item-effect">${effectText}</div>` : ''}
                        <div class="furniture-shop-item-maintenance">維護費 ${maintenance}/旬</div>
                    </div>
                    <div class="furniture-shop-item-price">
                        ${originalPrice !== finalPrice ? `<span class="furniture-shop-item-original">${originalPrice}</span>` : ''}
                        <span class="furniture-shop-item-final">${finalPrice} 元</span>
                        ${owned 
                            ? '<span class="furniture-shop-item-owned">✓ 已擁有</span>'
                            : `<button class="furniture-shop-item-btn" ${canBuy ? '' : 'disabled'}
                                       onclick="StreetFurnitureUI.buyFurniture('${furniture.furniture_id}')">購買</button>`
                        }
                    </div>
                </div>`;
        }).join('');
    },

    // === 購買家具 ===
    buyFurniture(furnitureId) {
        const result = StreetCore.buyFurniture(furnitureId);

        if (result.success) {
            showToast(result.message);
            updateStatsDisplay();
            this.open();  // 重新渲染
        } else {
            showToast(`❌ ${result.message}`);
        }
    }
};

window.StreetFurnitureUI = StreetFurnitureUI;

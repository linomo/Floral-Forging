/**
 * ShopUI - 販售台彈窗
 * js/scenes/shop-ui.js
 */
const ShopUI = {
    currentTab: 'material',      // 當前 Tab：material / design / product
    currentMultiplier: 1,        // 當前倍率
    selectedItems: [],           // 選中的物品 [{type, id/index, price, isDaxia}, ...]
    saleResults: [],             // 販售結果 [{price, isDaxia}, ...]

    // === CSS 樣式初始化 ===
    _initStyles() {
        if (document.getElementById('shop-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'shop-system-styles';
        style.textContent = `
            /* === 販售台 Modal === */
            .shop-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                width: 450px;           /* 固定寬度 */
                height: 580px;          /* 固定高度 */
                display: flex;
                flex-direction: column;
            }
            
            /* 行情顯示 */
            .shop-rate {
                text-align: center; padding: 12px;
                background: rgba(245, 166, 35, 0.1);
                border: 1px solid rgba(245, 166, 35, 0.3);
                border-radius: 10px; margin-bottom: 15px;
                font-size: 1.1em; color: #f5a623; font-weight: bold;
            }
            
            /* Tab 切換 */
            .shop-tabs {
                display: flex; gap: 8px; margin-bottom: 15px;
            }
            .shop-tab {
                flex: 1; padding: 10px; font-size: 0.95em;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; color: #aaa;
                cursor: pointer; transition: all 0.2s;
                font-family: inherit; text-align: center;
            }
            .shop-tab:hover { background: rgba(255,255,255,0.1); }
            .shop-tab.active {
                background: linear-gradient(90deg, #f5a623, #f5576c);
                border-color: #f5a623; color: #fff; font-weight: bold;
            }
            
            /* 提示文字 */
            .shop-hint {
                text-align: center; font-size: 0.85em;
                color: #888; margin-bottom: 12px;
            }
            
            /* 物品列表 */
            .shop-list {
                background: rgba(0,0,0,0.2); border-radius: 10px;
                padding: 12px; margin-bottom: 15px;
                height: 200px;          /* 固定高度 */
                overflow-y: auto;
                flex-shrink: 0;         /* 不縮小 */
            }
            .shop-item {
                display: flex; align-items: center; gap: 10px;
                padding: 10px; margin-bottom: 8px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; transition: all 0.2s;
            }
            .shop-item:last-child { margin-bottom: 0; }
            .shop-item:hover:not(.disabled) {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.2);
            }
            .shop-item.disabled {
                opacity: 0.4; cursor: not-allowed;
            }
            .shop-item-checkbox {
                width: 18px; height: 18px; cursor: pointer;
            }
            .shop-item.disabled .shop-item-checkbox {
                cursor: not-allowed;
            }
            .shop-item-info {
                flex: 1; font-size: 0.9em; color: #ccc;
                display: flex; justify-content: space-between;
                align-items: center;
            }
            .shop-item-name { color: #fff; }
            .shop-item-price { color: #7ed321; font-weight: bold; }
            .shop-item-note {
                font-size: 0.75em; color: #f5576c;
                margin-left: 8px;
            }
            .shop-empty {
                text-align: center; padding: 40px 20px;
                color: #555; font-size: 0.9em;
            }
            
            /* 販售結果區 */
            .shop-result {
                background: rgba(0,0,0,0.3); border-radius: 10px;
                padding: 15px; margin-bottom: 15px;
                min-height: 60px;
            }
            .shop-result-title {
                font-size: 0.9em; color: #888;
                margin-bottom: 8px; text-align: center;
            }
            .shop-result-content {
                font-size: 0.95em; line-height: 1.8;
                color: #fff; text-align: center;
                word-wrap: break-word;
            }
            
            /* 按鈕區 */
            .shop-actions {
                display: flex; gap: 10px;
            }
            .shop-btn {
                flex: 1; padding: 12px; font-size: 0.95em;
                background: linear-gradient(90deg, #f093fb, #f5576c);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                font-family: inherit; transition: all 0.2s;
            }
            .shop-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(245, 87, 108, 0.3);
            }
            .shop-btn:disabled {
                background: rgba(255,255,255,0.1);
                color: #666; cursor: not-allowed;
                transform: none;
            }
        `;
        document.head.appendChild(style);
    },

    // === 開啟販售台 ===
    open() {
        this._initStyles();

        // 扣除 EP（10 點）
        const epCost = 10;
        if (player.currentEP < epCost) {
            showToast('⚡ 元氣不足，無法使用販售台！');
            return;
        }
        player.currentEP -= epCost;
        updateStatsDisplay();

        // 重置狀態
        this.currentTab = 'material';
        this.selectedItems = [];
        this.saleResults = [];

        // 計算倍率
        this.currentMultiplier = ShopCore.calcMultiplier(player.int, player.luck);

        let modal = document.getElementById('shopModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'shopModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildModalHTML();
        this._initControls();
        modal.classList.add('show');
    },

    // === 關閉販售台 ===
    close() {
        const modal = document.getElementById('shopModal');
        if (modal) modal.classList.remove('show');
    },

    // === 建立 Modal HTML ===
    _buildModalHTML() {
        return `
            <div class="shop-modal">
                <div class="modal-title">📤 販售台</div>
                
                <!-- 行情顯示 -->
                <div class="shop-rate">行情：${this.currentMultiplier}</div>
                
                <!-- Tab 切換 -->
                <div class="shop-tabs">
                    <button class="shop-tab active" data-tab="material">材料</button>
                    <button class="shop-tab" data-tab="design">設計圖</button>
                    <button class="shop-tab" data-tab="product">成品</button>
                </div>
                
                <!-- 提示文字 -->
                <div class="shop-hint" id="shopHint">材料只能10個一組售出</div>
                
                <!-- 物品列表 -->
                <div class="shop-list" id="shopList">
                    ${this._renderList()}
                </div>
                
                <!-- 販售結果 -->
                <div class="shop-result">
                    <div class="shop-result-title">販售結果</div>
                    <div class="shop-result-content" id="shopResultContent">
                        ${this.saleResults.length === 0 ? '尚未販售...' : this._renderResults()}
                    </div>
                </div>
                
                <!-- 按鈕區 -->
                <div class="shop-actions">
                    <button class="shop-btn" onclick="ShopUI.selectAll()">全選</button>
                    <button class="shop-btn" onclick="ShopUI.sellSelected()" id="sellBtn">賣出選中項</button>
                </div>
                
                <div class="modal-actions" style="margin-top:15px">
                    <button class="modal-btn primary" onclick="ShopUI.close()">關閉</button>
                </div>
            </div>`;
    },

    // === 初始化控制項 ===
    _initControls() {
        // Tab 切換
        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentTab = tab.dataset.tab;
                this.selectedItems = [];  // 清空選擇
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._updateList();
            });
        });
    },

    // === 更新列表 ===
    _updateList() {
        const listEl = document.getElementById('shopList');
        const hintEl = document.getElementById('shopHint');
        
        // 更新提示文字
        if (this.currentTab === 'material') {
            hintEl.textContent = '材料只能10個一組售出';
        } else {
            hintEl.textContent = '';
        }
        
        // 更新列表內容
        listEl.innerHTML = this._renderList();
    },

    // === 渲染列表 ===
    _renderList() {
        switch (this.currentTab) {
            case 'material': return this._renderMaterialList();
            case 'design':   return this._renderDesignList();
            case 'product':  return this._renderProductList();
            default:         return '<div class="shop-empty">載入中...</div>';
        }
    },

    // === 渲染材料列表 ===
    _renderMaterialList() {
        const items = [];
        
        // 金屬材料
        Object.keys(player.materials.metal).forEach(id => {
            const amount = player.materials.metal[id];
            if (amount >= 10) {  // 只顯示 >= 10 的
                const mat = CSVLoader.data.metal.find(m => m.m_id === id);
                if (mat) {
                    const price = ShopCore.calcMaterialPrice(mat, this.currentMultiplier);
                    items.push({
                        type: 'metal',
                        id,
                        name: mat.name,
                        amount,
                        price
                    });
                }
            }
        });
        
        // 木材
        Object.keys(player.materials.wood).forEach(id => {
            const amount = player.materials.wood[id];
            if (amount >= 10) {
                const mat = CSVLoader.data.wood.find(w => w.w_id === id);
                if (mat) {
                    const price = ShopCore.calcMaterialPrice(mat, this.currentMultiplier);
                    items.push({
                        type: 'wood',
                        id,
                        name: mat.name,
                        amount,
                        price
                    });
                }
            }
        });
        
        if (items.length === 0) {
            return '<div class="shop-empty">目前沒有可販售的材料</div>';
        }
        
        return items.map(item => `
            <div class="shop-item">
                <input type="checkbox" class="shop-item-checkbox"
                    onchange="ShopUI.toggleItem('material', '${item.id}', ${item.price})">
                <div class="shop-item-info">
                    <span class="shop-item-name">${item.name}×10／${item.amount}</span>
                    <span class="shop-item-price">${item.price}元</span>
                </div>
            </div>`).join('');
    },

    // === 渲染設計圖列表 ===
    _renderDesignList() {
        if (player.designs.length === 0) {
            return '<div class="shop-empty">目前沒有可販售的設計圖</div>';
        }
        
        return player.designs.map((design, index) => {
            const chNum = ForgeScene.toChineseNumber(design.id);
            const price = ShopCore.calcDesignPrice(design, this.currentMultiplier);
            const isMiracle = design.grade === '奇‽';
            
            return `
                <div class="shop-item ${isMiracle ? 'disabled' : ''}">
                    <input type="checkbox" class="shop-item-checkbox"
                        ${isMiracle ? 'disabled' : ''}
                        onchange="ShopUI.toggleItem('design', ${index}, ${price}, '${design.grade}')">
                    <div class="shop-item-info">
                        <span class="shop-item-name">
                            ${chNum} ${design.grade}！${design.physical}${design.mental}${design.weapon}
                        </span>
                        <span>
                            <span class="shop-item-price">${price}元</span>
                            ${isMiracle ? '<span class="shop-item-note">無法販售</span>' : ''}
                        </span>
                    </div>
                </div>`;
        }).join('');
    },

    // === 渲染成品列表 ===
    _renderProductList() {
        if (player.products.length === 0) {
            return '<div class="shop-empty">目前沒有可販售的成品</div>';
        }
        
        return player.products.map((product, index) => {
            const chNum = ForgeScene.toChineseNumber(product.id);
            const price = ShopCore.calcProductPrice(product, this.currentMultiplier);
            const isMiracle = product.grade === '奇‽';
            const decoMark = product.decorated ? (product.decorationPrefix || '') : '';
            
            return `
                <div class="shop-item ${isMiracle ? 'disabled' : ''}">
                    <input type="checkbox" class="shop-item-checkbox"
                        ${isMiracle ? 'disabled' : ''}
                        onchange="ShopUI.toggleItem('product', ${index}, ${price}, '${product.grade}')">
                    <div class="shop-item-info">
                        <span class="shop-item-name">
                            ${decoMark}${chNum} ${product.grade}！${product.physical}${product.mental}${product.weapon}
                        </span>
                        <span>
                            <span class="shop-item-price">${price}元</span>
                            ${isMiracle ? '<span class="shop-item-note">無法販售</span>' : ''}
                        </span>
                    </div>
                </div>`;
        }).join('');
    },

    // === 切換選中狀態 ===
    toggleItem(type, idOrIndex, price, grade = '') {
        const key = `${type}-${idOrIndex}`;
        const existing = this.selectedItems.find(item => item.key === key);
        
        if (existing) {
            // 取消選中
            this.selectedItems = this.selectedItems.filter(item => item.key !== key);
        } else {
            // 檢查大俠收購（僅針對「奇」品）
            const isDaxia = ShopCore.checkDaxiaEvent(grade);
            const finalPrice = isDaxia ? ShopCore.calcDaxiaPrice(price) : price;
            
            // 選中
            this.selectedItems.push({
                key,
                type,
                idOrIndex,
                price: finalPrice,
                isDaxia
            });
        }
    },

    // === 全選 ===
    selectAll() {
        const checkboxes = document.querySelectorAll('.shop-item:not(.disabled) .shop-item-checkbox');
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        
        if (allChecked) {
            // 取消全選
            checkboxes.forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            });
        } else {
            // 全選
            checkboxes.forEach(cb => {
                if (!cb.checked) {
                    cb.checked = true;
                    cb.dispatchEvent(new Event('change'));
                }
            });
        }
    },

    // === 賣出選中項 ===
    sellSelected() {
        if (this.selectedItems.length === 0) {
            showToast('請選擇要販售的物品！');
            return;
        }
      // 分類收集要刪除的索引
    const designIndicesToRemove = [];
    const productIndicesToRemove = [];
    
    // 逐項處理（先加錢、記錄結果、收集索引）
    this.selectedItems.forEach(item => {
        player.money += item.price;
        
        if (item.type === 'material') {
            const isMetal = item.idOrIndex.startsWith('m');
            const mats = isMetal ? player.materials.metal : player.materials.wood;
            mats[item.idOrIndex] -= 10;
        } else if (item.type === 'design') {
            designIndicesToRemove.push(item.idOrIndex);
        } else if (item.type === 'product') {
            productIndicesToRemove.push(item.idOrIndex);
        }
        
        this.saleResults.push({
            price: item.price,
            isDaxia: item.isDaxia
        });
    });
    
    // 從大到小排序後刪除（避免索引錯位）
    designIndicesToRemove.sort((a, b) => b - a).forEach(index => {
        player.designs.splice(index, 1);
    });
    productIndicesToRemove.sort((a, b) => b - a).forEach(index => {
        player.products.splice(index, 1);
    });
        // 更新顯示
        updateStatsDisplay();
        document.getElementById('shopResultContent').innerHTML = this._renderResults();
        
        // 清空選中並重新渲染列表
        this.selectedItems = [];
        this._updateList();
        
        showToast(`✨ 販售成功！獲得 ${this.saleResults.reduce((sum, r) => sum + r.price, 0)} 元`);
        DialogueSystem.showDialogue('PC', '賣掉了！又有錢可以揮霍了！');
    },

    // === 渲染販售結果 ===
    _renderResults() {
        if (this.saleResults.length === 0) {
            return '尚未販售...';
        }
        
        // 取得大俠 ICON
        const daxiaChar = CSVLoader.getCharacter('DS');
        const daxiaIcon = daxiaChar ? daxiaChar.icon : '🔲';
        
        return this.saleResults.map(result => {
            const icon = result.isDaxia ? daxiaIcon : '';
            return `✶${result.price}元${icon}`;
        }).join('　');  // 全形空格分隔
    }
};

window.ShopUI = ShopUI;

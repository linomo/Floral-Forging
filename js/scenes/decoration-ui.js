/**
 * DecorationUI - 裝飾彈窗
 * js/scenes/decoration-ui.js
 */
const DecorationUI = {
    selectedProductIndex: null,
    selectedCost: null,

    _initStyles() {
        if (document.getElementById('decoration-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'decoration-system-styles';
        style.textContent = `
            .deco-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 400px; width: 90%;
            }
            .deco-select {
                width: 100%; padding: 10px; font-size: 1em;
                background: #B0D068;
                border: 1px solid rgba(255,255,255,0.2); border-radius: 8px;
                color: #fff; margin-bottom: 15px;
                font-family: inherit; text-align: center;
            }
            .deco-select:focus { outline: none; border-color: #f5a623; }
            .deco-select:disabled { opacity: 0.4; cursor: not-allowed; }
            .deco-cost-row { display: flex; gap: 8px; margin-bottom: 15px; }
            .deco-cost-btn {
                flex: 1; padding: 8px; font-size: 0.9em;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
                color: #aaa; cursor: pointer; transition: all 0.2s; font-family: inherit;
            }
            .deco-cost-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
            .deco-cost-btn.selected { background: linear-gradient(90deg, #f5a623, #f5576c); border-color: #f5a623; color: #fff; font-weight: bold; }
            .deco-cost-btn:disabled { opacity: 0.3; cursor: not-allowed; }
            .deco-action-btn {
                width: 100%; padding: 12px; font-size: 1em;
                background: linear-gradient(90deg, #f093fb, #f5576c);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                margin-bottom: 15px; font-family: inherit; transition: all 0.2s;
            }
            .deco-action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 87, 108, 0.3); }
            .deco-action-btn:disabled { background: rgba(255,255,255,0.1); color: #666; cursor: not-allowed; transform: none; }
            .deco-result {
                padding: 20px; background: rgba(0,0,0,0.3);
                border-radius: 12px; text-align: center; min-height: 80px;
            }
            .deco-result-title   { font-size: 1.2em; color: #f5a623; margin-bottom: 10px; }
            .deco-result-content { font-size: 1.1em; color: #fff; }
            .deco-result-price   { font-size: 1em; color: #7ed321; margin-top: 8px; }
            .deco-result-note    { font-size: 0.85em; color: #aaa; margin-top: 8px; }
            .deco-result-stats   {
                display: flex; justify-content: center; flex-wrap: wrap; gap: 6px;
                margin-top: 10px; min-height: 24px;
            }
            .deco-stat-tag {
                padding: 2px 8px; border-radius: 8px; font-size: 0.82em; font-weight: bold;
                background: rgba(255,255,255,0.08);
            }
            .deco-stat-tag.positive { color: #7ed321; }
            .deco-stat-tag.negative { color: #f5576c; }
        `;
        document.head.appendChild(style);
    },

    open() {
        this._initStyles();

        let modal = document.getElementById('decorationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'decorationModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        this.selectedProductIndex = null;
        this.selectedCost = null;

        const undecoratedProducts = player.products.filter(p => !p.decorated);

        modal.innerHTML = `
            <div class="deco-modal">
                <div class="modal-title">🎨 裝飾</div>

                <select class="deco-select" id="decoProductSelect"
                    ${undecoratedProducts.length === 0 ? 'disabled' : ''}>
                    <option value="">
                        ${undecoratedProducts.length === 0 ? '沒有可裝飾的成品' : '選擇成品'}
                    </option>
                    ${this._generateProductOptions(undecoratedProducts)}
                </select>

                <div class="deco-cost-row">
                    ${[10, 30, 100].map(cost => `
                        <button class="deco-cost-btn" id="decoCost${cost}"
                            onclick="DecorationUI.selectCost(${cost})"
                            ${undecoratedProducts.length === 0 ? 'disabled' : ''}>
                            ${cost}
                        </button>`).join('')}
                </div>

                <button class="deco-action-btn" id="decoBtn" disabled
                    onclick="DecorationUI.execute()">
                    🎀 變好看吧！
                </button>

                <div class="deco-result">
                    <div class="deco-result-title">☄️ 降落！☄️</div>
                    <div class="deco-result-content" id="decoResultContent">等待裝飾...</div>
                    <div class="deco-result-price"   id="decoResultPrice"></div>
                    <div class="deco-result-note"    id="decoResultNote"></div>
                    <div class="deco-result-stats"   id="decoResultStats"></div>
                </div>

                <div class="modal-actions">
                    <button class="modal-btn primary" onclick="DecorationUI.close()">關閉</button>
                </div>
            </div>`;

        document.getElementById('decoProductSelect')
            .addEventListener('change', e => this._onSelectProduct(e));

        modal.classList.add('show');
    },

    close() {
        const modal = document.getElementById('decorationModal');
        if (modal) modal.classList.remove('show');
    },

    _generateProductOptions(undecoratedProducts) {
        return undecoratedProducts.map(p => {
            const realIndex = player.products.indexOf(p);
            const chNum = ForgeScene.toChineseNumber(p.id);
            return `<option value="${realIndex}">${chNum} ${p.grade}！${p.physical}${p.mental}${p.weapon}（💰${p.sellPrice}元）</option>`;
        }).join('');
    },

    _onSelectProduct(e) {
        const val = e.target.value;
        this.selectedProductIndex = val !== '' ? parseInt(val) : null;
        this._updateBtn();
    },

    selectCost(cost) {
        this.selectedCost = cost;
        [10, 30, 100].forEach(c => {
            const btn = document.getElementById(`decoCost${c}`);
            if (btn) btn.classList.toggle('selected', c === cost);
        });
        this._updateBtn();
    },

    _updateBtn() {
        const btn = document.getElementById('decoBtn');
        if (!btn) return;
        const epCost = DecorationCore.calcEP(player.mood);
        const ready  = this.selectedProductIndex !== null
                    && this.selectedCost !== null
                    && player.currentEP >= epCost
                    && player.money >= this.selectedCost;
        btn.disabled = !ready;
    },

    // 格式化數值變動標籤
    _statTag(label, value) {
        const sign = value > 0 ? '+' : '';
        const cls  = value > 0 ? 'positive' : 'negative';
        return `<span class="deco-stat-tag ${cls}">${label} ${sign}${value}</span>`;
    },

    execute() {
        if (this.selectedProductIndex === null || this.selectedCost === null) return;

        const product = player.products[this.selectedProductIndex];
        if (!product) return;

        const epCost = DecorationCore.calcEP(player.mood);
        if (player.currentEP < epCost) { showToast('⚡ 元氣不足！'); return; }
        if (player.money < this.selectedCost) { showToast('💰 錢不夠！'); return; }

        // 消耗資源
        player.currentEP -= epCost;
        player.money     -= this.selectedCost;
        player.dirtiness  = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));

        // 套用花費固定效果
        const statChanges = [];
        const costEffect = DecorationCore.getCostEffect(this.selectedCost);
        if (costEffect) {
            if (costEffect.stat === 'mood') {
                player.mood   = Math.max(0, Math.min(100, player.mood   + costEffect.value));
                statChanges.push(this._statTag('MOOD', costEffect.value));
            } else if (costEffect.stat === 'stress') {
                player.stress = Math.max(0, Math.min(100, player.stress + costEffect.value));
                statChanges.push(this._statTag('STRESS', costEffect.value));
            }
        }

        // 計算裝飾結果
        const randomNum  = DecorationCore.rollRandom(player.int);
        const multiplier = DecorationCore.getMultiplier(randomNum, this.selectedCost);
        const newPrice   = Math.round(product.sellPrice * multiplier);

        // 套用結果效果
        let prefix, note;
        if (multiplier > 1) {
            prefix = '🎀'; note = '變好看了！跟我一樣！';
            player.mood   = Math.max(0, Math.min(100, player.mood + 10));
            statChanges.push(this._statTag('MOOD', +10));
        } else if (multiplier < 1) {
            prefix = '💥'; note = '大爆走了啊啊啊！';
            player.stress = Math.max(0, Math.min(100, player.stress + 10));
            statChanges.push(this._statTag('STRESS', +10));
        } else {
            prefix = '〰️'; note = '沒有反應只是一個成品。';
        }

        // 套用並鎖定
        product.sellPrice = newPrice;
        product.decorated = true;

        // 顯示結果
        const chNum = ForgeScene.toChineseNumber(product.id);
        document.getElementById('decoResultContent').textContent =
            `${prefix} ${chNum} ${product.grade}！${product.physical}${product.mental}${product.weapon}`;
        document.getElementById('decoResultPrice').textContent = `💰 售價 ${newPrice}元`;
        document.getElementById('decoResultNote').textContent  = note;
        document.getElementById('decoResultStats').innerHTML   = statChanges.join('');

        // 鎖住操作區
        document.getElementById('decoBtn').disabled = true;
        document.getElementById('decoProductSelect').disabled = true;
        [10, 30, 100].forEach(c => {
            const btn = document.getElementById(`decoCost${c}`);
            if (btn) btn.disabled = true;
        });

        updateStatsDisplay();
        showToast(`🎨 裝飾完成！${prefix}`);
        DialogueSystem.showDialogue('PC', note);
    }
};

window.DecorationUI = DecorationUI;

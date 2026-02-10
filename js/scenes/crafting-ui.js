/**
 * CraftingUI - 鍛造彈窗
 * js/scenes/crafting-ui.js
 */
const CraftingUI = {
    selectedDesign:     null,
    selectedMetalGrade: '',
    selectedWoodGrade:  '',

    _initStyles() {
        if (document.getElementById('forge-crafting-styles')) return;
        const style = document.createElement('style');
        style.id = 'forge-crafting-styles';
        style.textContent = `
            .forge-modal { background: linear-gradient(180deg, #252535 0%, #1a1a28 100%); border-radius: 16px; padding: 20px; max-width: 500px; width: 90%; }
            .forge-section { margin-bottom: 20px; }
            .forge-section-title { font-size: 1em; color: #f5a623; margin-bottom: 10px; text-align: center; }
            .forge-design-select { width: 100%; padding: 12px; font-size: 1em; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-family: inherit; text-align: center; }
            .forge-design-select:focus { outline: none; border-color: #f5a623; }
            .forge-design-select option { background: #B0D068; color: #fff; padding: 10px; }
            .forge-material-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; }
            .forge-material-label { font-size: 1em; min-width: 80px; color: #ccc; }
            .forge-grade-buttons { display: flex; gap: 8px; flex: 1; }
            .forge-grade-btn { flex: 1; padding: 8px; font-size: 0.9em; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: #aaa; cursor: pointer; transition: all 0.2s; font-family: inherit; }
            .forge-grade-btn:hover:not(:disabled) { background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.4); }
            .forge-grade-btn.selected { background: linear-gradient(90deg, #f5a623, #f5576c); border-color: #f5a623; color: #fff; font-weight: bold; }
            .forge-grade-btn:disabled { opacity: 0.3; cursor: not-allowed; }
            .forge-preview { display: flex; justify-content: center; align-items: center; gap: 15px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; margin-bottom: 15px; font-size: 0.95em; }
            .forge-preview-item { color: #ccc; }
            .forge-preview-value { color: #4ecdc4; font-weight: bold; }
            .forge-action-btn { width: 100%; padding: 15px; font-size: 1.1em; background: linear-gradient(90deg, #f5576c, #f093fb); border: none; border-radius: 10px; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s; margin-bottom: 15px; }
            .forge-action-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(245, 87, 108, 0.4); }
            .forge-action-btn:disabled { background: rgba(255,255,255,0.1); color: #666; cursor: not-allowed; transform: none; }
            .forge-result { padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; text-align: center; min-height: 80px; }
            .forge-result-title { font-size: 1.2em; color: #f5a623; margin-bottom: 10px; }
            .forge-result-content { font-size: 1.1em; color: #fff; }
            .forge-result-price { font-size: 1em; color: #7ed321; margin-top: 8px; }
        `;
        document.head.appendChild(style);
    },

    // === 開啟彈窗 ===
    open() {
        this._initStyles();
        let modal = document.getElementById('forgeModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'forgeModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        this.selectedDesign     = null;
        this.selectedMetalGrade = '';
        this.selectedWoodGrade  = '';

        modal.innerHTML = `
            <div class="forge-modal">
                <div class="modal-title">🔨 鍛造</div>
                <div class="forge-section">
                    <div class="forge-section-title">【要來創造哪個傳奇？】</div>
                    <select class="forge-design-select" id="forgeDesignSelect">
                        <option value="">請選擇設計圖</option>
                        ${this._generateDesignOptions()}
                    </select>
                </div>
                <div class="forge-section" id="forgeMaterialSection">
                    <div class="forge-material-row">
                        <div class="forge-material-label">⚙️ 金<span id="forgeMetalNeed">?</span></div>
                        <div class="forge-grade-buttons" id="forgeMetalGrades">
                            <button class="forge-grade-btn" disabled>爛</button>
                            <button class="forge-grade-btn" disabled>普</button>
                            <button class="forge-grade-btn" disabled>好</button>
                            <button class="forge-grade-btn" disabled>奇</button>
                        </div>
                    </div>
                    <div class="forge-material-row">
                        <div class="forge-material-label">🥖 木<span id="forgeWoodNeed">?</span></div>
                        <div class="forge-grade-buttons" id="forgeWoodGrades">
                            <button class="forge-grade-btn" disabled>爛</button>
                            <button class="forge-grade-btn" disabled>普</button>
                            <button class="forge-grade-btn" disabled>好</button>
                            <button class="forge-grade-btn" disabled>奇</button>
                        </div>
                    </div>
                </div>
                <div class="forge-preview" id="forgePreview">
                    <span class="forge-preview-item">⚡ <span class="forge-preview-value" id="forgeEP">0</span></span>
                    <span class="forge-preview-item">💰 <span class="forge-preview-value">10元</span></span>
                    <span class="forge-preview-item">💩 +<span class="forge-preview-value" id="forgeDirt">0</span></span>
                </div>
                <button class="forge-action-btn" id="forgeBtn" disabled>舉起你的槌子來，讓我來看看你的匡匡匡</button>
                <div class="forge-result">
                    <div class="forge-result-title">☄️ 降落！☄️</div>
                    <div class="forge-result-content" id="forgeResultContent">等待鍛造...</div>
                    <div class="forge-result-price" id="forgeResultPrice"></div>
                </div>
                <div class="modal-actions"><button class="modal-btn primary" onclick="CraftingUI.close()">關閉</button></div>
            </div>`;

        this._initControls();
        modal.classList.add('show');
    },

    // === 關閉彈窗 ===
    close() {
        const modal = document.getElementById('forgeModal');
        if (modal) modal.classList.remove('show');
    },

    _generateDesignOptions() {
        if (!player.designs || player.designs.length === 0) return '<option value="">尚無設計圖</option>';
        return player.designs.map((design, index) => {
            const chNum = ForgeScene.toChineseNumber(design.id);
            return `<option value="${index}">${chNum} ${design.grade}！${design.physical}${design.mental}${design.weapon}</option>`;
        }).join('');
    },

    _initControls() {
        document.getElementById('forgeDesignSelect').addEventListener('change', (e) => {
            const index = parseInt(e.target.value);
            if (isNaN(index)) { this.selectedDesign = null; return; }
            this.selectedDesign     = player.designs[index];
            this.selectedMetalGrade = '';
            this.selectedWoodGrade  = '';
            this._updateMaterialOptions();
            this._updatePreview();
        });
        document.getElementById('forgeBtn').addEventListener('click', () => this._executeCraft());
    },

    _updateMaterialOptions() {
        if (!this.selectedDesign) return;
        document.getElementById('forgeMetalNeed').textContent = this.selectedDesign.metalNeed;
        document.getElementById('forgeWoodNeed').textContent  = this.selectedDesign.woodNeed;

        const gradeOrder = { '爛': 0, '普': 1, '好': 2, '奇': 3 };
        const designGrade = this.selectedDesign.grade.replace('‽', '');
        const gradeMap    = { '爛': '01', '普': '02', '好': '03', '奇': '04' };

        const buildBtns = (containerId, type) => {
            const container = document.getElementById(containerId);
            container.innerHTML = '';
            ['爛', '普', '好', '奇'].forEach(grade => {
                const btn    = document.createElement('button');
                btn.className = 'forge-grade-btn';
                btn.textContent = grade;
                const matId  = (type === 'metal' ? 'm' : 'w') + gradeMap[grade];
                const need   = type === 'metal' ? this.selectedDesign.metalNeed : this.selectedDesign.woodNeed;
                const have   = type === 'metal'
                    ? (player.materials.metal[matId] || 0)
                    : (player.materials.wood[matId]  || 0);
                btn.disabled = gradeOrder[grade] < gradeOrder[designGrade] || have < need;
                btn.addEventListener('click', () => {
                    if (type === 'metal') this.selectedMetalGrade = grade;
                    else                  this.selectedWoodGrade  = grade;
                    container.querySelectorAll('.forge-grade-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    this._updatePreview();
                });
                container.appendChild(btn);
            });
        };

        buildBtns('forgeMetalGrades', 'metal');
        buildBtns('forgeWoodGrades',  'wood');
    },

    _updatePreview() {
        if (!this.selectedDesign) return;
        const designEP = parseInt(this.selectedDesign.ep) || 0;
        const epCost   = Math.max(0, designEP - Math.floor(player.str / 20));
        document.getElementById('forgeEP').textContent   = epCost;
        document.getElementById('forgeDirt').textContent = Math.ceil(epCost / 2);
        document.getElementById('forgeBtn').disabled     =
            !this.selectedMetalGrade || !this.selectedWoodGrade
            || player.currentEP < epCost || player.money < 10;
    },

    _executeCraft() {
        if (!this.selectedDesign || !this.selectedMetalGrade || !this.selectedWoodGrade) return;
        const designEP = parseInt(this.selectedDesign.ep) || 0;
        const epCost   = Math.max(0, designEP - Math.floor(player.str / 20));

        if (player.currentEP < epCost) { showToast('⚡ 元氣不足！'); return; }
        if (player.money < 10)         { showToast('💰 錢不夠！');   return; }

        const gradeMap = { '爛': '01', '普': '02', '好': '03', '奇': '04' };
        const metalId  = 'm' + gradeMap[this.selectedMetalGrade];
        const woodId   = 'w' + gradeMap[this.selectedWoodGrade];

        const metalData  = CSVLoader.data.metal.find(m => m.m_id === metalId);
        const woodData   = CSVLoader.data.wood.find(w => w.w_id === woodId);
        const weaponData = CSVLoader.data.weapons.find(w => w.name === this.selectedDesign.weapon);
        const physData   = CSVLoader.data.physical.find(p => p.name === this.selectedDesign.physical);

        const metalPrice   = parseInt(metalData?.price)  || 0;
        const woodPrice    = parseInt(woodData?.price)   || 0;
        const weaponMulti  = weaponData ? parseFloat(weaponData.price_multiplier.replace('*', '')) : 1;
        const physicalMulti = physData  ? parseFloat(physData.effect_value_2.replace('*', '')) : 1;

        const sellPrice = Math.floor(
            (this.selectedDesign.metalNeed * metalPrice + this.selectedDesign.woodNeed * woodPrice)
            * weaponMulti * physicalMulti
        );

        // 扣除資源
        player.materials.metal[metalId] -= this.selectedDesign.metalNeed;
        player.materials.wood[woodId]   -= this.selectedDesign.woodNeed;
        player.currentEP -= epCost;
        player.money     -= 10;
        player.dirtiness  = Math.min(100, player.dirtiness + Math.ceil(epCost / 2));

        const product = {
            id: player.products.length + 1,
            grade:     this.selectedDesign.grade,
            physical:  this.selectedDesign.physical,
            mental:    this.selectedDesign.mental,
            weapon:    this.selectedDesign.weapon,
            sellPrice,
            metalGrade: this.selectedMetalGrade,
            woodGrade:  this.selectedWoodGrade
        };
        player.products.push(product);

        const chNum = ForgeScene.toChineseNumber(product.id);
        document.getElementById('forgeResultContent').textContent =
            `${chNum} ${product.grade}！${product.physical}${product.mental}${product.weapon}`;
        document.getElementById('forgeResultPrice').textContent = `💰 售價 ${sellPrice}元`;

        updateStatsDisplay();
        showToast(`✨ 鍛造成功！獲得 ${product.weapon}！`);
        DialogueSystem.showDialogue('PC', `匡匡匡！完成了！${product.grade}！${product.weapon}！`);

        setTimeout(() => { this.close(); this.open(); }, 2000);
    }
};

window.CraftingUI = CraftingUI;

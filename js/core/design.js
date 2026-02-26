/**
 * DesignGenerator - 設計圖抽卡計算
 * js/core/design.js
 */
const DesignGenerator = {

    // === 輔助函數 ===
    _random(min, max) { return Math.random() * (max - min) + min; },
    _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    _clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

    _getGrade(v) {
        if (v <= 25) return '爛';
        if (v <= 50) return '普';
        if (v <= 75) return '好';
        return '奇';
    },

    // === 根據 LUCK 抽整體品級 ===
    _drawGradeByLuck(luck) {
        const row = CSVLoader.data.luckRandom.find(r => {
            const min = parseInt(r.luck_min) || 0;
            const max = parseInt(r.luck_max) || 100;
            return luck >= min && luck <= max;
        });
        if (!row) return '普';
        const p爛 = parseInt(row['爛']) || 0;
        const p普 = parseInt(row['普']) || 0;
        const p好 = parseInt(row['好']) || 0;
        const roll = Math.random() * 100;
        if (roll < p爛) return '爛';
        if (roll < p爛 + p普) return '普';
        if (roll < p爛 + p普 + p好) return '好';
        return '奇';
    },

    // === 從品級池中隨機取一個 ===
    _drawFromPool(pool, grade) {
        const filtered = pool.filter(item => item.grade === grade);
        return filtered.length > 0 ? this._pick(filtered) : null;
    },

    // === 抽物理前綴 ===
    _drawPhysical(physVal) {
        return this._drawFromPool(CSVLoader.data.physical, this._getGrade(physVal));
    },

    // === 抽心理前綴（含下抽機制 + 天才白癡線）===
    _drawMental(mentVal) {
        const grade = this._getGrade(mentVal);
        const roll  = Math.random() * 100;

        if (grade === '爛') {
            if (roll < 5) return { ...this._drawFromPool(CSVLoader.data.mental, '奇'), miracle: true };
            return { ...this._drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
        }
        if (grade === '普') {
            if (roll < 30) return { ...this._drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
            return { ...this._drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
        }
        if (grade === '好') {
            if (roll < 10) return { ...this._drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
            if (roll < 40) return { ...this._drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
            return { ...this._drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
        }
        // 奇
        if (roll <  5) return { ...this._drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
        if (roll < 20) return { ...this._drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
        if (roll < 50) return { ...this._drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
        return { ...this._drawFromPool(CSVLoader.data.mental, '奇'), miracle: false };
    },

    // === 格式化效果標籤 ===
    _formatEffect(stat, value) {
        const val = parseInt(value) || 0;
        if (val === 0) return null;
        // 好感度為隱藏數值，不顯示
        if (['SF', 'SS', 'DS', 'SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat)) return null;
        const sign = val > 0 ? '+' : '';
        const cls  = val > 0 ? 'positive' : 'negative';
        return `<span class="effect-tag ${cls}">${stat}${sign}${val}</span>`;
    },

    // === 主要抽卡（回傳設計圖物件）===
    draw(player) {
        // 過濾可用武器（已解鎖）
        const available = CSVLoader.data.weapons.filter(w =>
            player.unlockedWeapons.includes(w.wea_id)
        );
        if (available.length === 0) return null;

        // 計算數值
        const physVal = this._clamp(player.str * 0.7 + player.luck * 0.3 + this._random(-5, 5), 0, 100);
        const mentVal = this._clamp(player.int * (player.mood / 50) + this._random(-5, 5), 0, 100);

        const overallGrade = this._drawGradeByLuck(player.luck);
        const physical     = this._drawPhysical(physVal);
        const mental       = this._drawMental(mentVal);
        const weapon       = this._pick(available);

        if (!physical || !mental || !weapon) return null;

        const displayGrade = mental.miracle ? '奇‽' : overallGrade;

        // === 計算材料需求 ===
        let metalNeed = parseInt(weapon.metal) || 0;
        let woodNeed  = parseInt(weapon.wood)  || 0;
        const pStat   = physical.effect_sta_1;
        const pVal    = parseInt(physical.effect_value_1) || 0;
        if (pStat === 'metal') metalNeed += pVal;
        if (pStat === 'wood')  woodNeed  += pVal;
        metalNeed = Math.max(0, metalNeed);
        woodNeed  = Math.max(0, woodNeed);

        // === EP 需求 ===
        const ep = parseInt(weapon.maker_point) || 20;

        // === 效果標籤 ===
        const effects = [];
        for (let i = 1; i <= 3; i++) {
            const eff = this._formatEffect(mental[`effect_sta_${i}`], mental[`effect_value_${i}`]);
            if (eff) effects.push(eff);
        }
        if (['SF', 'SS', 'DS'].includes(pStat) && pVal !== 0) {
            const eff = this._formatEffect(pStat, pVal);
            if (eff) effects.push(eff);
        }

        // === 評論過濾（處理 unlock_trigger）===
        const comments = CSVLoader.data.comments.filter(c => {
            if (c.grade !== displayGrade) return false;
            
            // 沒有解鎖條件的評論總是顯示
            if (!c.unlock_trigger || c.unlock_trigger === '') return true;
            
            // 有解鎖條件的評論，需要檢查物理前綴是否符合
            return physical.pp_id === c.unlock_trigger;
        });

        return {
            grade:           displayGrade,
            physical:        physical.name,
            mental:          mental.name,
            weapon:          weapon.name,
            metalNeed,
            woodNeed,
            ep,
            effects,
            comments,
            mentalPrefixData: mental,
            blueprintPrice:  0   // 由 DesignUI 計算後填入
        };
    }
};

window.DesignGenerator = DesignGenerator;

/**
 * DesignGenerator - 設計圖核心生成邏輯
 * 存放路徑：js/core/design-generator.js
 */
const DesignGenerator = {
    random(min, max) { return Math.random() * (max - min) + min; },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
    
    getGradeLabel(value) {
        if (value <= 25) return '爛';
        if (value <= 50) return '普';
        if (value <= 75) return '好';
        return '奇';
    },

    // 依據幸運值從 luck_random.csv 抽取品級
    drawGradeByLuck(luck) {
        const row = CSVLoader.data.luckRandom.find(r => {
            const min = parseInt(r.luck_min) || 0;
            const max = parseInt(r.luck_max) || 100;
            return luck >= min && luck <= max;
        });
        if (!row) return '普';
        
        const roll = Math.random() * 100;
        const p爛 = parseInt(row['爛']) || 0;
        const p普 = parseInt(row['普']) || 0;
        const p好 = parseInt(row['好']) || 0;
        
        if (roll < p爛) return '爛';
        if (roll < p爛 + p普) return '普';
        if (roll < p爛 + p普 + p好) return '好';
        return '奇';
    },

    formatEffect(stat, value) {
        if (!stat || stat === 'NaN' || value === '' || value === undefined) return null;
        const isMult = typeof value === 'string' && value.includes('*');
        const val = isMult ? parseFloat(value.replace('*', '')) : parseInt(value);
        
        // 關鍵：數值無變動（+0 或 *1）則隱藏
        if (!isMult && val === 0) return null;
        if (isMult && val === 1) return null;

        const isSpecial = ['SF', 'SS', 'DS', 'SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat);
        const sign = isMult ? '' : (val > 0 ? '+' : '');
        const className = isSpecial ? 'special' : (val > (isMult ? 1 : 0) ? 'positive' : 'negative');
        
        return `<span class="effect-tag ${className}">${stat}${sign}${value}</span>`;
    },

    draw(player) {
        // 1. 計算實質強度與抽取的品級
        const physVal = this.clamp(player.str * 0.7 + player.luck * 0.3 + this.random(-5, 5), 0, 100);
        const mentVal = this.clamp(player.mood * 0.5 + player.int * 0.3 + this.random(-20, 20), 0, 100);
        const overallGrade = this.drawGradeByLuck(player.luck);
        
        // 2. 隨機選取前綴
        const physical = CSVLoader.data.physical.find(p => p.grade === this.getGradeLabel(physVal)) || this.pick(CSVLoader.data.physical);
        const mental = CSVLoader.data.mental.find(m => m.grade === this.getGradeLabel(mentVal)) || this.pick(CSVLoader.data.mental);

        // 3. 武器過濾：檢查 weapon.unlock_trigger 是否在 player.readBooks 中
        const availableWeapons = CSVLoader.data.weapons.filter(w => 
            !w.unlock_trigger || player.readBooks.includes(w.unlock_trigger)
        );
        const weapon = this.pick(availableWeapons) || CSVLoader.data.weapons[0];
        
        // 奇‽ 特殊觸發 (心情爛但骰出奇)
        const displayGrade = (this.getGradeLabel(mentVal) === '爛' && overallGrade === '奇' && Math.random() < 0.1) ? '奇‽' : overallGrade;
        
        // 4. 三欄位數值掃描 (metal, wood, price)
        let mNeed = parseInt(weapon.metal) || 0;
        let wNeed = parseInt(weapon.wood) || 0;
        let pMulti = weapon.price_multiplier ? parseFloat(weapon.price_multiplier.replace('*','')) : 1;

        [physical, mental].forEach(pre => {
            for(let i=1; i<=3; i++) {
                const s = pre[`effect_sta_${i}`], v = pre[`effect_value_${i}`];
                if (s === 'metal') mNeed += (parseInt(v) || 0);
                if (s === 'wood') wNeed += (parseInt(v) || 0);
                if (s === 'price' && v) pMulti *= parseFloat(v.replace('*','')) || 1;
            }
        });

        const gData = CSVLoader.data.grades.find(g => g.grade === overallGrade.replace('‽',''));
        const gMulti = gData ? parseFloat(gData.effect_value_1.replace('*','')) : 1;
        
        // 5. 標籤處理
        const effects = [];
        [physical, mental].forEach(pre => {
            for(let i=1; i<=3; i++) {
                const s = pre[`effect_sta_${i}`], v = pre[`effect_value_${i}`];
                const tag = this.formatEffect(s, v);
                // 排除已計算過的 metal/wood/price 標籤
                if (tag && !['metal','wood','price'].includes(s)) effects.push(tag);
            }
        });

        return {
            grade: displayGrade,
            physical: physical.name,
            mental: mental.name,
            weapon: weapon.name,
            metalNeed: Math.max(0, mNeed),
            woodNeed: Math.max(0, wNeed),
            price: Math.floor(30 * gMulti * pMulti), // 基礎售價 30
            ep: weapon.maker_point,
            effects,
            comments: CSVLoader.data.comments.filter(c => 
                c.grade === displayGrade.replace('‽','') && 
                (!c.unlock_trigger || c.unlock_trigger === physical.pp_id)
            )
        };
    }
};

window.DesignGenerator = DesignGenerator;

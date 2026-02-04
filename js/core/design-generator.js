// ===================================
// 設計圖生成系統 - 支援 3 欄位與好感度
// ===================================

const DesignGenerator = {
  random(min, max) { return Math.random() * (max - min) + min; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
  
  getGrade(value) {
    if (value <= 25) return '爛';
    if (value <= 50) return '普';
    if (value <= 75) return '好';
    return '奇';
  },

  drawGradeByLuck(luck) {
    const row = CSVLoader.data.luckRandom.find(r => {
      const min = parseInt(r.luck_min) || 0;
      const max = parseInt(r.luck_max) || 100;
      return luck >= min && luck <= max;
    });
    if (!row) return '普';
    const prob爛 = parseInt(row['爛']) || 0;
    const prob普 = parseInt(row['普']) || 0;
    const prob好 = parseInt(row['好']) || 0;
    const roll = Math.random() * 100;
    if (roll < prob爛) return '爛';
    if (roll < prob爛 + prob普) return '普';
    if (roll < prob爛 + prob普 + prob好) return '好';
    return '奇';
  },

  // 物理與心理計算公式
  calcPhysical(str, luck) { return this.clamp(str * 0.7 + luck * 0.3 + this.random(-5, 5), 0, 100); },
  calcMental(int, mood) { 
    // 使用新公式：MOOD*0.5 + INT*0.3 + RANDOM(-20, 20)
    return this.clamp(mood * 0.5 + int * 0.3 + this.random(-20, 20), 0, 100); 
  },

  drawFromPool(pool, grade) {
    const filtered = pool.filter(item => item.grade === grade);
    return filtered.length > 0 ? this.pick(filtered) : null;
  },

  drawPhysicalPrefix(value) { return this.drawFromPool(CSVLoader.data.physical, this.getGrade(value)); },

  drawMentalPrefix(value) {
    const grade = this.getGrade(value);
    const roll = Math.random() * 100;
    if (grade === '爛' && roll < 5) return { ...this.drawFromPool(CSVLoader.data.mental, '奇'), miracle: true };
    if (grade === '爛') return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
    if (grade === '普') {
      if (roll < 30) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
      return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
    }
    if (grade === '好') {
      if (roll < 10) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
      if (roll < 40) return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
      return { ...this.drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
    }
    if (roll < 5) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
    if (roll < 20) return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
    if (roll < 50) return { ...this.drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
    return { ...this.drawFromPool(CSVLoader.data.mental, '奇'), miracle: false };
  },

formatEffect(stat, value) {
    if (!stat || stat === 'NaN' || !value) return null;

    // 解析數值：如果是乘號開頭則抓數字部分，否則轉整數
    const isMultiplier = typeof value === 'string' && value.includes('*');
    const val = isMultiplier ? parseFloat(value.replace('*', '')) : parseInt(value);

    // --- 關鍵邏輯：數值沒有改變則不顯示 ---
    if (!isMultiplier && val === 0) return null; // 加法類：+0 不顯示
    if (isMultiplier && val === 1) return null; // 乘法類：*1 不顯示

    const isSpecial = ['SF', 'SS', 'DS', 'SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat);
    const isPositive = val > (isMultiplier ? 1 : 0);
    const sign = isMultiplier ? '' : (isPositive ? '+' : '');
    
    const className = isSpecial ? 'special' : (isPositive ? 'positive' : 'negative');

    return `<span class="effect-tag ${className}">${stat}${sign}${value}</span>`;
  },

  getComments(displayGrade, physical) {
    const specialTriggers = ['pp24', 'pp25', 'pp26'];
    const triggerType = specialTriggers.includes(physical.pp_id) ? physical.pp_id : '';
    const comments = CSVLoader.data.comments.filter(c => 
      c.prefixes_grade === displayGrade.replace('‽', '') && (c.trigger_type === triggerType)
    );
    return comments.length > 0 ? comments : [];
  },

  draw(player) {
    const physicalVal = this.calcPhysical(player.str, player.luck);
    const mentalVal = this.calcMental(player.int, player.mood);
    const overallGrade = this.drawGradeByLuck(player.luck);
    
    const physical = this.drawPhysicalPrefix(physicalVal);
    const mental = this.drawMentalPrefix(mentalVal);
    const weapon = this.pick(CSVLoader.data.weapons);
    
    if (!physical || !mental || !weapon) return null;
    const displayGrade = mental.miracle ? '奇‽' : overallGrade;
    
    // --- 掃描式數值計算 ---
    let metalNeed = parseInt(weapon.metal) || 0;
    let woodNeed = parseInt(weapon.wood) || 0;
    let physicalMulti = 1;

    // 掃描物理前綴的 3 個欄位
    for (let i = 1; i <= 3; i++) {
      const sta = physical[`effect_sta_${i}`];
      const val = physical[`effect_value_${i}`];
      if (sta === 'metal') metalNeed += (parseInt(val) || 0);
      if (sta === 'wood') woodNeed += (parseInt(val) || 0);
      if (sta === 'price' && val) physicalMulti = parseFloat(val.replace('*', '')) || 1;
    }

    const gradeData = CSVLoader.data.grades.find(g => g.grade === overallGrade);
    const gradeMulti = parseFloat(gradeData?.effect_value_?.replace('*', '')) || 1;
    const price = Math.floor(30 * gradeMulti * physicalMulti);
    const ep = weapon.maker_point || '??';
    
    // --- 掃描式標籤收集 ---
    const effects = [];
    [physical, mental].forEach(prefix => {
      for (let i = 1; i <= 3; i++) {
        const sta = prefix[`effect_sta_${i}`];
        const val = prefix[`effect_value_${i}`];
        // 排除掉已經計算過的基礎數值，其餘顯示為標籤
        if (sta && !['metal', 'wood', 'price', 'NaN'].includes(sta)) {
          const effTag = this.formatEffect(sta, val);
          if (effTag) effects.push(effTag);
        }
      }
    });
    
    return {
      grade: displayGrade,
      physical: physical.name,
      mental: mental.name,
      weapon: weapon.name,
      metalNeed: Math.max(0, metalNeed),
      woodNeed: Math.max(0, woodNeed),
      price,
      ep,
      effects,
      comments: this.getComments(displayGrade, physical)
    };
  }
};
window.DesignGenerator = DesignGenerator;

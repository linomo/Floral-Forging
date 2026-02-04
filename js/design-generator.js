// ===================================
// 設計圖生成系統 - 抽卡與評論
// ===================================

const DesignGenerator = {
  // 工具函數
  random(min, max) { 
    return Math.random() * (max - min) + min; 
  },
  
  pick(arr) { 
    return arr[Math.floor(Math.random() * arr.length)]; 
  },
  
  clamp(v, min, max) { 
    return Math.max(min, Math.min(max, v)); 
  },
  
  getGrade(value) {
    if (value <= 25) return '爛';
    if (value <= 50) return '普';
    if (value <= 75) return '好';
    return '奇';
  },

  // 根據 LUCK 抽品級
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

  // 計算物理值
  calcPhysical(str, luck) {
    return this.clamp(str * 0.7 + luck * 0.3 + this.random(-5, 5), 0, 100);
  },

  // 計算心理值
  calcMental(int, mood) {
    return this.clamp(int * (mood / 50) + this.random(-5, 5), 0, 100);
  },

  // 從池中抽卡
  drawFromPool(pool, grade) {
    const filtered = pool.filter(item => item.grade === grade);
    return filtered.length > 0 ? this.pick(filtered) : null;
  },

  // 抽物理前綴
  drawPhysicalPrefix(value) {
    const grade = this.getGrade(value);
    return this.drawFromPool(CSVLoader.data.physical, grade);
  },

  // 抽心理前綴（含天才白癡線）
  drawMentalPrefix(value) {
    const grade = this.getGrade(value);
    const roll = Math.random() * 100;
    
    // 天才白癡線：爛區間 5% 抽到奇
    if (grade === '爛' && roll < 5) {
      return { ...this.drawFromPool(CSVLoader.data.mental, '奇'), miracle: true };
    }
    if (grade === '爛') {
      return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
    }
    
    // 普區間：30%爛 70%普
    if (grade === '普') {
      if (roll < 30) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
      return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
    }
    
    // 好區間：10%爛 30%普 60%好
    if (grade === '好') {
      if (roll < 10) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
      if (roll < 40) return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
      return { ...this.drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
    }
    
    // 奇區間：5%爛 15%普 30%好 50%奇
    if (roll < 5) return { ...this.drawFromPool(CSVLoader.data.mental, '爛'), miracle: false };
    if (roll < 20) return { ...this.drawFromPool(CSVLoader.data.mental, '普'), miracle: false };
    if (roll < 50) return { ...this.drawFromPool(CSVLoader.data.mental, '好'), miracle: false };
    return { ...this.drawFromPool(CSVLoader.data.mental, '奇'), miracle: false };
  },

  // 抽武器
  drawWeapon() {
    return this.pick(CSVLoader.data.weapons);
  },

  // 格式化效果標籤
  formatEffect(stat, value) {
    const val = parseInt(value) || 0;
    if (val === 0) return null;
    
    const isSpecial = ['SF', 'SS', 'DS'].includes(stat);
    const isPositive = val > 0;
    const sign = isPositive ? '+' : '';
    const className = isSpecial ? 'special' : (isPositive ? 'positive' : 'negative');
    
    return `<span class="effect-tag ${className}">${stat}${sign}${val}</span>`;
  },

  // 取得評論（含特殊觸發）
  getComments(displayGrade, physical) {
    // 檢查是否有特殊觸發（pp24/pp25/pp26）
    const specialTriggers = ['pp24', 'pp25', 'pp26'];
    const triggerType = specialTriggers.includes(physical.pp_id) ? physical.pp_id : '';
    
    // 如果有特殊觸發，優先抓特殊評論
    if (triggerType) {
      const specialComments = CSVLoader.data.comments.filter(
        c => c.prefixes_grade === displayGrade && c.trigger_type === triggerType
      );
      if (specialComments.length > 0) {
        return specialComments;
      }
    }
    
    // 否則抓普通評論
    return CSVLoader.data.comments.filter(
      c => c.prefixes_grade === displayGrade && (!c.trigger_type || c.trigger_type === '')
    );
  },

  // 主要抽卡函數
  draw(player) {
    const physicalVal = this.calcPhysical(player.str, player.luck);
    const mentalVal = this.calcMental(player.int, player.mood);
    const overallGrade = this.drawGradeByLuck(player.luck);
    
    const physical = this.drawPhysicalPrefix(physicalVal);
    const mental = this.drawMentalPrefix(mentalVal);
    const weapon = this.drawWeapon();
    
    if (!physical || !mental || !weapon) {
      console.error('抽卡失敗，資料可能未載入');
      return null;
    }
    
    const displayGrade = mental.miracle ? '奇‽' : overallGrade;
    
    // 計算材料需求
    const baseMetalCost = parseInt(weapon.metal) || 0;
    const baseWoodCost = parseInt(weapon.wood) || 0;
    const physicalStat = physical.effect_sta_1;
    const physicalExtra = parseInt(physical.effect_value_1) || 0;
    
    let metalNeed = baseMetalCost;
    let woodNeed = baseWoodCost;
    if (physicalStat === 'metal') metalNeed += physicalExtra;
    if (physicalStat === 'wood') woodNeed += physicalExtra;
    metalNeed = Math.max(0, metalNeed);
    woodNeed = Math.max(0, woodNeed);
    
    // 計算價格
    const gradeData = CSVLoader.data.grades.find(g => g.grade === overallGrade);
    const gradeMulti = parseFloat(gradeData?.effect_value_?.replace('*', '')) || 1;
    const physicalMulti = parseFloat(physical.effect_value_2?.replace('*', '')) || 1;
    const price = Math.floor(30 * gradeMulti * physicalMulti);
    
    const ep = weapon.maker_point || '??';
    
    // 收集效果
    const effects = [];
    const mentalEff1 = this.formatEffect(mental.effect_sta_1, mental.effect_value_1);
    const mentalEff2 = this.formatEffect(mental.effect_sta_2, mental.effect_value_2);
    if (mentalEff1) effects.push(mentalEff1);
    if (mentalEff2) effects.push(mentalEff2);
    
    // 物理前綴特殊效果（好感度）
    if (['SF', 'SS', 'DS'].includes(physical.effect_sta_1)) {
      const physEff = this.formatEffect(physical.effect_sta_1, physical.effect_value_1);
      if (physEff) effects.push(physEff);
    }
    
    // 取得評論
    const comments = this.getComments(displayGrade, physical);
    
    return {
      grade: displayGrade,
      physical: physical.name,
      mental: mental.name,
      weapon: weapon.name,
      metalNeed,
      woodNeed,
      price,
      ep,
      effects,
      comments
    };
  }
};

// 匯出全域可用
window.DesignGenerator = DesignGenerator;

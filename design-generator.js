// === CSV 讀取 ===
async function loadCSV(filename) {
  const response = await fetch(`data/${filename}`);
  const text = await response.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i] ? values[i].trim() : '';
    });
    return obj;
  });
}

// === 全域資料 ===
let DATA = {
  grades: [],
  physical: [],
  mental: [],
  weapons: [],
  metal: [],
  wood: [],
  comments: []
};

// === 初始化載入所有 CSV ===
async function initData() {
  try {
    DATA.grades = await loadCSV('prefixes_grade.csv');
    DATA.physical = await loadCSV('prefixes_physical.csv');
    DATA.mental = await loadCSV('prefixes_mental.csv');
    DATA.weapons = await loadCSV('weapon.csv');
    DATA.metal = await loadCSV('metal.csv');
    DATA.wood = await loadCSV('wood.csv');
    DATA.comments = await loadCSV('grade_comments.csv');
    
    // 啟用按鈕
    document.getElementById('drawBtn').disabled = false;
    document.getElementById('drawBtn').textContent = '🎴 繪製設計圖';
    document.getElementById('card').innerHTML = '<div class="placeholder">點擊按鈕產生設計圖...</div>';
    
    console.log('資料載入完成！', DATA);
  } catch (error) {
    console.error('載入失敗:', error);
    document.getElementById('card').innerHTML = '<div class="placeholder">載入失敗，請確認 CSV 檔案</div>';
  }
}

// === 工具函數 ===
function random(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function getGrade(value) {
  if (value <= 25) return '爛';
  if (value <= 50) return '普';
  if (value <= 75) return '好';
  return '奇';
}

function getGradeIndex(grade) {
  return { '爛': 0, '普': 1, '好': 2, '奇': 3 }[grade];
}

// === 計算函數 ===
function calcOverall(str, int, dex, luck) {
  const base = (str + int + dex) / 3;
  const luckAdj = (luck - 50) / 100;
  return clamp(base * (1 + luckAdj) + random(-5, 5), 0, 100);
}

function calcPhysical(str, luck) {
  return clamp(str * 0.7 + luck * 0.3 + random(-5, 5), 0, 100);
}

function calcMental(int, mood) {
  return clamp(int * (mood / 50) + random(-5, 5), 0, 100);
}

// === 抽卡函數 ===
function drawFromPool(pool, grade) {
  const filtered = pool.filter(item => item.grade === grade);
  return pick(filtered);
}

function drawPhysicalPrefix(value) {
  const grade = getGrade(value);
  return drawFromPool(DATA.physical, grade);
}

function drawMentalPrefix(value) {
  const grade = getGrade(value);
  const roll = Math.random() * 100;
  
  // 天才白癡線：爛區間 5% 抽到奇
  if (grade === '爛' && roll < 5) {
    return { ...drawFromPool(DATA.mental, '奇'), miracle: true };
  }
  if (grade === '爛') return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
  
  // 普區間：30%爛 70%普
  if (grade === '普') {
    if (roll < 30) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
    return { ...drawFromPool(DATA.mental, '普'), miracle: false };
  }
  
  // 好區間：10%爛 30%普 60%好
  if (grade === '好') {
    if (roll < 10) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
    if (roll < 40) return { ...drawFromPool(DATA.mental, '普'), miracle: false };
    return { ...drawFromPool(DATA.mental, '好'), miracle: false };
  }
  
  // 奇區間：5%爛 15%普 30%好 50%奇
  if (roll < 5) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
  if (roll < 20) return { ...drawFromPool(DATA.mental, '普'), miracle: false };
  if (roll < 50) return { ...drawFromPool(DATA.mental, '好'), miracle: false };
  return { ...drawFromPool(DATA.mental, '奇'), miracle: false };
}

function drawWeapon() {
  return pick(DATA.weapons);
}

// === 取得材料資訊 ===
function getMaterial(type, grade) {
  const pool = type === 'metal' ? DATA.metal : DATA.wood;
  const gradeIdx = getGradeIndex(grade);
  // 可用該等級以下的材料，這裡先用對應等級的
  const available = pool.filter(m => getGradeIndex(m.grade) <= gradeIdx);
  return available.length > 0 ? available[available.length - 1] : pool[0];
}

// === 計算價格 ===
function calcPrice(weapon, grade, physical, metalMat, woodMat) {
  const baseMetalCost = parseInt(weapon.metal) || 0;
  const baseWoodCost = parseInt(weapon.wood) || 0;
  const metalExtra = parseInt(physical.effect_value_1) || 0;
  const physicalStat = physical.effect_sta_1;
  
  // 計算材料花費
  let metalNeed = baseMetalCost;
  let woodNeed = baseWoodCost;
  if (physicalStat === 'metal') metalNeed += metalExtra;
  if (physicalStat === 'wood') woodNeed += metalExtra;
  
  // 材料價格
  const metalPrice = parseInt(metalMat.price) || 0;
  const woodPrice = parseInt(woodMat.price) || 0;
  const baseMaterialCost = (metalNeed * metalPrice) + (woodNeed * woodPrice);
  
  // 品級倍率
  const gradeData = DATA.grades.find(g => g.grade === grade);
  const gradeMulti = parseFloat(gradeData?.effect_value_?.replace('*', '')) || 1;
  
  // 武器倍率
  const weaponMulti = parseFloat(weapon['price=metal.price+wood.price']?.replace('*', '')) || 1;
  
  // 物理前綴倍率
  const physicalMulti = parseFloat(physical.effect_value_2?.replace('*', '')) || 1;
  
  return Math.floor(baseMaterialCost * gradeMulti * weaponMulti * physicalMulti);
}

// === 取得評論 ===
function getComments(grade) {
  return DATA.comments.filter(c => c.grade === grade);
}

// === 格式化效果顯示 ===
function formatEffect(stat, value) {
  const val = parseInt(value) || 0;
  if (val === 0) return null;
  
  const isSpecial = ['SF', 'SS', 'DS'].includes(stat);
  const isPositive = val > 0;
  const sign = isPositive ? '+' : '';
  
  let className = isSpecial ? 'special' : (isPositive ? 'positive' : 'negative');
  
  return `<span class="effect-tag ${className}">${stat}${sign}${val}</span>`;
}

// === 主要抽卡函數 ===
function draw() {
  const str = parseInt(document.getElementById('str').value) || 0;
  const int = parseInt(document.getElementById('int').value) || 0;
  const dex = parseInt(document.getElementById('dex').value) || 0;
  const luck = parseInt(document.getElementById('luck').value) || 0;
  const mood = parseInt(document.getElementById('mood').value) || 0;
  
  // 計算數值
  const overallVal = calcOverall(str, int, dex, luck);
  const physicalVal = calcPhysical(str, luck);
  const mentalVal = calcMental(int, mood);
  
  // 決定品級
  const overallGrade = getGrade(overallVal);
  
  // 抽前綴
  const physical = drawPhysicalPrefix(physicalVal);
  const mental = drawMentalPrefix(mentalVal);
  
  // 抽武器
  const weapon = drawWeapon();
  
  // 決定顯示品級（天才白癡線）
  const displayGrade = mental.miracle ? '奇‽' : overallGrade;
  
  // 取得材料
  const metalMat = getMaterial('metal', overallGrade);
  const woodMat = getMaterial('wood', overallGrade);
  
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
  const price = calcPrice(weapon, overallGrade, physical, metalMat, woodMat);
  
  // EP
  const ep = weapon.maker_point || '??';
  
  // 收集效果
  const effects = [];
  
  // 心理前綴效果（影響角色）
  const mentalEff1 = formatEffect(mental.effect_sta_1, mental.effect_value_1);
  const mentalEff2 = formatEffect(mental.effect_sta_2, mental.effect_value_2);
  if (mentalEff1) effects.push(mentalEff1);
  if (mentalEff2) effects.push(mentalEff2);
  
  // 物理前綴特殊效果（好感度）
  if (['SF', 'SS', 'DS'].includes(physical.effect_sta_1)) {
    const physEff = formatEffect(physical.effect_sta_1, physical.effect_value_1);
    if (physEff) effects.push(physEff);
  }
  
  // 取得評論
  const comments = getComments(displayGrade);
  
  // 渲染卡片
  const card = document.getElementById('card');
  card.className = `card grade-${displayGrade}`;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-grade grade-${displayGrade}">${displayGrade}！${physical.name}${mental.name}</div>
      <div class="card-weapon">${weapon.name}</div>
    </div>
    <div class="card-info">
      <div class="info-item">
        <span class="info-label">⚙️ 金</span>
        <span class="info-value metal">${metalNeed} (${metalMat.name})</span>
      </div>
      <div class="info-item">
        <span class="info-label">🪵 木</span>
        <span class="info-value wood">${woodNeed} (${woodMat.name})</span>
      </div>
      <div class="info-item">
        <span class="info-label">💰 價格</span>
        <span class="info-value price">${price}</span>
      </div>
      <div class="info-item">
        <span class="info-label">⚡ EP</span>
        <span class="info-value ep">${ep}</span>
      </div>
    </div>
    ${effects.length > 0 ? `
    <div class="card-effects">
      <div class="effect-title">📝 設計時效果</div>
      <div class="effect-row">${effects.join('')}</div>
    </div>
    ` : ''}
    <div class="card-comments">
      ${comments.map(c => `
        <div class="comment-line">
          <span class="comment-icon">${c.icon}</span>
          <span class="comment-text">「${c.comment}」</span>
        </div>
      `).join('')}
    </div>
  `;
}

// === 啟動 ===
initData();

// === 玩家資料 ===
const player = {
  str: 30,
  int: 25,
  dex: 40,
  luck: 50,
  mood: 50,
  stress: 25,
  designs: []
};

// === CSV 資料 ===
let DATA = {
  grades: [],
  physical: [],
  mental: [],
  weapons: [],
  metal: [],
  wood: [],
  comments: [],
  luckRandom: []
};

let currentDesign = null;

// === 角色資料 ===
const CHARACTERS = {
  PC: { name: '小哈', color: '#4a90d9' },
  SF: { name: '師父', color: '#f5a623' },
  SX: { name: '小師兄', color: '#7ed321' },
  DS: { name: '神秘大俠', color: '#9013fe' }
};

// === CSV 讀取 ===
async function loadCSV(filename) {
  const response = await fetch(`data/${filename}`);
  const text = await response.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
    return obj;
  });
}

async function initData() {
  try {
    DATA.grades = await loadCSV('prefixes_grade.csv');
    DATA.physical = await loadCSV('prefixes_physical.csv');
    DATA.mental = await loadCSV('prefixes_mental.csv');
    DATA.weapons = await loadCSV('weapon.csv');
    DATA.metal = await loadCSV('metal.csv');
    DATA.wood = await loadCSV('wood.csv');
    DATA.comments = await loadCSV('grade_comments.csv');
    DATA.luckRandom = await loadCSV('luck_random.csv');
    console.log('✅ 資料載入完成！', DATA);
  } catch (error) {
    console.error('❌ 載入失敗:', error);
  }
}

// === 工具函數 ===
function random(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function getGrade(v) {
  if (v <= 25) return '爛';
  if (v <= 50) return '普';
  if (v <= 75) return '好';
  return '奇';
}

// === 品級抽卡（根據 LUCK 查表）===
function drawGradeByLuck(luck) {
  const row = DATA.luckRandom.find(r => {
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
}

// === 計算函數 ===
function calcPhysical(str, luck) {
  return clamp(str * 0.7 + luck * 0.3 + random(-5, 5), 0, 100);
}
function calcMental(int, mood) {
  return clamp(int * (mood / 50) + random(-5, 5), 0, 100);
}

// === 抽卡函數 ===
function drawFromPool(pool, grade) {
  const filtered = pool.filter(item => item.grade === grade);
  return filtered.length > 0 ? pick(filtered) : null;
}

function drawPhysicalPrefix(value) {
  return drawFromPool(DATA.physical, getGrade(value));
}

function drawMentalPrefix(value) {
  const grade = getGrade(value);
  const roll = Math.random() * 100;
  
  // 天才白癡線：爛區間 5% 抽到奇
  if (grade === '爛' && roll < 5) {
    return { ...drawFromPool(DATA.mental, '奇'), miracle: true };
  }
  if (grade === '爛') return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
  
  if (grade === '普') {
    if (roll < 30) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
    return { ...drawFromPool(DATA.mental, '普'), miracle: false };
  }
  
  if (grade === '好') {
    if (roll < 10) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
    if (roll < 40) return { ...drawFromPool(DATA.mental, '普'), miracle: false };
    return { ...drawFromPool(DATA.mental, '好'), miracle: false };
  }
  
  // 奇
  if (roll < 5) return { ...drawFromPool(DATA.mental, '爛'), miracle: false };
  if (roll < 20) return { ...drawFromPool(DATA.mental, '普'), miracle: false };
  if (roll < 50) return { ...drawFromPool(DATA.mental, '好'), miracle: false };
  return { ...drawFromPool(DATA.mental, '奇'), miracle: false };
}

// === 效果格式化 ===
function formatEffect(stat, value) {
  const val = parseInt(value) || 0;
  if (val === 0) return null;
  const isSpecial = ['SF', 'SS', 'DS'].includes(stat);
  const isPositive = val > 0;
  const sign = isPositive ? '+' : '';
  let className = isSpecial ? 'special' : (isPositive ? 'positive' : 'negative');
  return `<span class="effect-tag ${className}">${stat}${sign}${val}</span>`;
}

// === 繪製設計圖 ===
function drawDesign() {
  const physicalVal = calcPhysical(player.str, player.luck);
  const mentalVal = calcMental(player.int, player.mood);
  const overallGrade = drawGradeByLuck(player.luck);
  
  const physical = drawPhysicalPrefix(physicalVal);
  const mental = drawMentalPrefix(mentalVal);
  const weapon = pick(DATA.weapons);
  
  if (!physical || !mental || !weapon) {
    console.error('抽卡失敗，資料可能未載入');
    return;
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
  const gradeData = DATA.grades.find(g => g.grade === overallGrade);
  const gradeMulti = parseFloat(gradeData?.effect_value_?.replace('*', '')) || 1;
  const physicalMulti = parseFloat(physical.effect_value_2?.replace('*', '')) || 1;
  const price = Math.floor(30 * gradeMulti * physicalMulti);
  
  const ep = weapon.maker_point || '??';
  
  // 收集效果
  const effects = [];
  const mentalEff1 = formatEffect(mental.effect_sta_1, mental.effect_value_1);
  const mentalEff2 = formatEffect(mental.effect_sta_2, mental.effect_value_2);
  if (mentalEff1) effects.push(mentalEff1);
  if (mentalEff2) effects.push(mentalEff2);
  if (['SF', 'SS', 'DS'].includes(physical.effect_sta_1)) {
    const physEff = formatEffect(physical.effect_sta_1, physical.effect_value_1);
    if (physEff) effects.push(physEff);
  }
  
  // 取得評論
  const comments = DATA.comments.filter(c => c.grade === displayGrade);
  
  // 儲存當前設計
  currentDesign = {
    grade: displayGrade,
    physical: physical.name,
    mental: mental.name,
    weapon: weapon.name,
    metalNeed, woodNeed, price, ep, effects
  };
  
  // 渲染卡片
  const card = document.getElementById('designCard');
  card.className = `card grade-${displayGrade}`;
  card.innerHTML = `
    <div class="card-header">
      <div class="card-grade grade-${displayGrade}">${displayGrade}！${physical.name}${mental.name}</div>
      <div class="card-weapon">${weapon.name}</div>
    </div>
    <div class="card-info">
      <div class="info-item">
        <span class="info-label">⚙️ 金</span>
        <span class="info-value metal">${metalNeed}</span>
      </div>
      <div class="info-item">
        <span class="info-label">🪵 木</span>
        <span class="info-value wood">${woodNeed}</span>
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
    <div class="card-effects">
      <div class="effect-title">📝 讓我看看！</div>
      <div class="effect-row">${effects.length > 0 ? effects.join('') : '&nbsp;'}</div>
    </div>
    <div class="card-comments">
      ${comments.map(c => `
        <div class="comment-line">
          <span class="comment-icon">${c.icon}</span>
          <span class="comment-text">「${c.comment}」</span>
        </div>
      `).join('')}
    </div>
  `;
  
  document.getElementById('saveBtn').style.display = 'block';
}

// === 房間互動 ===
function clickRoom(item) {
  const actions = {
    desk: () => openDesignModal(),
    shelf: () => showDialogue('PC', '🤔', '書架上有好多鍛造的書......'),
    anvil: () => showDialogue('SF', '🧔', '先畫好設計圖再來打鐵。'),
    furnace: () => showDialogue('PC', '🔥', '爐火很旺，可以開始工作了。'),
    water: () => showDialogue('PC', '💧', '淬火用的水桶，水還很乾淨。'),
    materials: () => showDialogue('PC', '📦', '材料庫存......金: 50, 木: 50'),
    window: () => showDialogue('PC', '🌤️', '外面天氣不錯。'),
    door: () => showDialogue('SF', '😤', '做完事再出去！')
  };
  
  if (actions[item]) actions[item]();
}

// === 對話系統 ===
function showDialogue(speakerId, emoji, text) {
  const char = CHARACTERS[speakerId];
  document.getElementById('speaker-color').style.background = char.color;
  document.getElementById('speaker-name').style.color = char.color;
  document.getElementById('speaker-name').textContent = char.name;
  document.getElementById('dialogue-emoji').textContent = emoji;
  document.getElementById('dialogue-text').textContent = text;
}

function nextDialogue() {
  showToast('（繼續中...）');
}

// === 設計圖彈窗 ===
function openDesignModal() {
  document.getElementById('designModal').classList.add('show');
  currentDesign = null;
  document.getElementById('designCard').innerHTML = '<div class="card-placeholder">在腦中構思設計圖...</div>';
  document.getElementById('designCard').className = 'card';
  document.getElementById('saveBtn').style.display = 'none';
}

function closeDesignModal() {
  document.getElementById('designModal').classList.remove('show');
}

function saveDesign() {
  if (currentDesign) {
    player.designs.push(currentDesign);
    showToast(`📜 獲得設計圖：${currentDesign.grade}！${currentDesign.weapon}`);
    closeDesignModal();
    showDialogue('PC', '😆', `完成了！${currentDesign.grade}！${currentDesign.physical}${currentDesign.mental}${currentDesign.weapon}！`);
  }
}

// === 效果提示 ===
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// === 初始化 ===
initData();

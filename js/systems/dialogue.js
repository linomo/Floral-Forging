// ===================================
// 對話系統 - 管理對話顯示
// ===================================

const DialogueSystem = {
  // 在主畫面下方顯示對話
  showDialogue(charaId, text) {
    const char = CharacterSystem.getCharacter(charaId);
    if (!char) return;
    
    const colorBlock = document.getElementById('speaker-color');
    const speakerName = document.getElementById('speaker-name');
    const emoji = document.getElementById('dialogue-emoji');
    const dialogueText = document.getElementById('dialogue-text');
    
    if (colorBlock) colorBlock.style.background = char.color;
    if (speakerName) {
      speakerName.textContent = char.name;
      speakerName.style.color = char.color;
    }
    if (emoji) emoji.textContent = char.icon;
    if (dialogueText) dialogueText.textContent = text;
  },

  // 顯示設計圖評論（在彈窗下方）
  showDesignComments(comments) {
    // 檢查是否存在評論容器
    let commentsBox = document.getElementById('design-comments-box');
    
    // 如果不存在，創建它
    if (!commentsBox) {
      commentsBox = document.createElement('div');
      commentsBox.id = 'design-comments-box';
      commentsBox.className = 'design-comments-box';
      
      // 🔧 修正：插入到 modal-overlay 裡面，而不是外面
      const modalOverlay = document.getElementById('designModal');
      if (modalOverlay) {
        modalOverlay.appendChild(commentsBox);
      }
    }
    
    // 渲染評論
    const html = comments.map(c => {
      const char = CharacterSystem.getCharacter(c.chara_icon);
      if (!char) return '';
      
      return `
        <div class="design-comment-line">
          <span class="design-comment-icon" style="color: ${char.color}">${char.icon}</span>
          <span class="design-comment-text" style="color: ${char.color}">${c.comment}</span>
        </div>
      `;
    }).join('');
    
    commentsBox.innerHTML = html;
    commentsBox.style.display = comments.length > 0 ? 'block' : 'none';
  },

  // 隱藏設計圖評論
  hideDesignComments() {
    const commentsBox = document.getElementById('design-comments-box');
    if (commentsBox) {
      commentsBox.style.display = 'none';
    }
  }
};

// 匯出全域可用
window.DialogueSystem = DialogueSystem;

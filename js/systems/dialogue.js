/**
 * DialogueSystem - 對話顯示
 * js/systems/dialogue.js
 */
const DialogueSystem = {

    // 顯示主對話框（左下角）
    showDialogue(charaId, text) {
        const char = CharacterSystem.getCharacter(charaId);
        if (!char) return;

        const colorEl = document.getElementById('speaker-color');
        const nameEl  = document.getElementById('speaker-name');
        const emojiEl = document.getElementById('dialogue-emoji');
        const textEl  = document.getElementById('dialogue-text');

        if (colorEl) colorEl.style.background = char.color;
        if (nameEl) { nameEl.textContent = (charaId === 'PC' ? player.name : char.name); nameEl.style.color = char.color; }
        if (emojiEl) emojiEl.textContent = char.icon;
        if (textEl)  textEl.textContent  = text;
    },

    // 顯示設計圖評論（對話框下方 #design-comments）
    // comments = grade_comments.csv 資料列陣列 [{grade, chara_id, comment}, ...]
    showDesignComments(comments) {
        const box = document.getElementById('design-comments');
        if (!box) return;

        if (!comments || comments.length === 0) {
            box.style.display = 'none';
            return;
        }

        box.innerHTML = comments.map(c => {
            // 透過 chara_id 取得角色資料
            const char = CharacterSystem.getCharacter(c.chara_id);
            const icon = char ? char.icon : '❓';
            const color = char ? char.color : '#888';
            
            return `
                <div class="comment-line">
                    <span class="comment-icon" style="color: ${color}">${icon}</span>
                    <span class="comment-text">「${c.comment}」</span>
                </div>`;
        }).join('');

        box.style.display = 'block';
    },

    hideDesignComments() {
        const box = document.getElementById('design-comments');
        if (box) box.style.display = 'none';
    }
};

window.DialogueSystem = DialogueSystem;

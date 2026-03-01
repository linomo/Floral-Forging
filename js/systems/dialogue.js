/**
 * DialogueSystem - 對話顯示
 * js/systems/dialogue.js
 */
const DialogueSystem = {

    // 顯示主對話框
    showDialogue(charaId, text) {
        const char = CharacterSystem.getCharacter(charaId);
        if (!char) { console.error('❌ 找不到角色資料！'); return; }

        const colorEl = document.getElementById('speaker-color');
        const nameEl  = document.getElementById('speaker-name');
        const textEl  = document.getElementById('dialogue-text');
        const iconEl  = document.getElementById('speaker-icon');
        if (iconEl)  iconEl.textContent  = char.icon;
        if (colorEl) colorEl.style.background = char.color;
        if (nameEl) {
            nameEl.textContent = (charaId === 'PC' ? player.name : char.name);
            nameEl.style.color = char.color;
        }
        if (textEl) textEl.textContent = text;
    },

    // ================================
    // 繼續按鈕（供 intro 等系統使用）
    // ================================

    // 顯示繼續按鈕，點擊後執行 callback
    showNextBtn(callback) {
        let btn = document.getElementById('dialogue-next-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'dialogue-next-btn';
            btn.style.cssText = `
            padding: 4px 14px;
            background: rgba(245,166,35,0.15);
            border: 1px solid #f5a623;
            border-radius: 20px;
            color: #f5a623; font-size: 0.8em;
            font-family: inherit; cursor: pointer;
            transition: background 0.2s;
            margin-left: auto;
        `;
            btn.textContent = '▶ 繼續';
            btn.onmouseover = () => { btn.style.background = 'rgba(245,166,35,0.3)'; };
            btn.onmouseout  = () => { btn.style.background = 'rgba(245,166,35,0.15)'; };

            const dialogueHeader = document.querySelector('.dialogue-header');
            if (dialogueHeader) {
                dialogueHeader.style.justifyContent = 'space-between';
                dialogueHeader.appendChild(btn);
            }
        }

        // 重新綁定 callback（每次點都是新的）
        const newBtn = btn.cloneNode(true);
        newBtn.onmouseover = () => { newBtn.style.background = 'rgba(245,166,35,0.3)'; };
        newBtn.onmouseout  = () => { newBtn.style.background = 'rgba(245,166,35,0.15)'; };
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', callback);
        newBtn.style.display = 'block';
    },

    // 隱藏繼續按鈕
    hideNextBtn() {
        const btn = document.getElementById('dialogue-next-btn');
        if (btn) btn.style.display = 'none';
    },

    // 顯示設計圖評論
    showDesignComments(comments) {
        const box = document.getElementById('design-comments');
        if (!box) return;

        if (!comments || comments.length === 0) {
            box.style.display = 'none';
            return;
        }

        box.innerHTML = comments.map(c => {
            const char  = CharacterSystem.getCharacter(c.chara_id);
            const icon  = char ? char.icon  : '❓';
            const color = char ? char.color : '#888';
            return `
                <div class="comment-line">
                    <span class="comment-icon" style="color:${color}">${icon}</span>
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

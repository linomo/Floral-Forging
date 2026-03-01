/**
 * DialogueSystem - 對話顯示
 * js/systems/dialogue.js
 */
const DialogueSystem = {

    showDialogue(charaId, text) {
        const char = CharacterSystem.getCharacter(charaId);
        if (!char) { console.error('❌ 找不到角色資料！'); return; }

        const colorEl = document.getElementById('speaker-color');
        const iconEl  = document.getElementById('speaker-icon');
        const nameEl  = document.getElementById('speaker-name');
        const textEl  = document.getElementById('dialogue-text');

        if (colorEl) colorEl.style.background = char.color;
        if (iconEl)  iconEl.textContent        = char.icon;
        if (nameEl) {
            nameEl.textContent = (charaId === 'PC' ? player.name : char.name);
            nameEl.style.color = char.color;
        }
        if (textEl) {
            textEl.textContent = text;
            textEl.style.color = char.color;  // 對話文字用角色代表色
        }
    },

    // ================================
    // 繼續按鈕
    // ================================
    showNextBtn(callback) {
        let btn = document.getElementById('dialogue-next-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'dialogue-next-btn';
            btn.textContent = '▶ 繼續';
            btn.style.cssText = `
                padding: 4px 14px;
                background: rgba(245,166,35,0.15);
                border: 1px solid #f5a623;
                border-radius: 20px;
                color: #f5a623; font-size: 0.8em;
                font-family: inherit; cursor: pointer;
                transition: background 0.2s;
                margin-left: auto;
                flex-shrink: 0;
            `;
            btn.onmouseover = () => { btn.style.background = 'rgba(245,166,35,0.3)'; };
            btn.onmouseout  = () => { btn.style.background = 'rgba(245,166,35,0.15)'; };

            const dialogueHeader = document.querySelector('.dialogue-header');
            if (dialogueHeader) {
                dialogueHeader.style.justifyContent = 'flex-start';
                dialogueHeader.appendChild(btn);
            }
        }

        // 重新綁定 callback
        const newBtn = btn.cloneNode(true);
        newBtn.onmouseover = () => { newBtn.style.background = 'rgba(245,166,35,0.3)'; };
        newBtn.onmouseout  = () => { newBtn.style.background = 'rgba(245,166,35,0.15)'; };
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', callback);
        newBtn.style.display = 'inline-block';
    },

    hideNextBtn() {
        const btn = document.getElementById('dialogue-next-btn');
        if (btn) btn.style.display = 'none';
    },

    // ================================
    // 設計圖評論
    // ================================
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

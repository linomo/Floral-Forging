/**
 * DialogueSystem - 對話顯示
 * js/systems/dialogue.js
 */
const DialogueSystem = {

    // 顯示主對話框（左下角）
    showDialogue(charaId, text) {
        console.log('🗣️ DialogueSystem.showDialogue 被呼叫');
        console.log('  角色ID:', charaId);
        console.log('  對話內容:', text);
        
        const char = CharacterSystem.getCharacter(charaId);
        console.log('  角色資料:', char);
        
        if (!char) {
            console.error('❌ 找不到角色資料！');
            return;
        }

        const colorEl = document.getElementById('speaker-color');
        const nameEl  = document.getElementById('speaker-name');
        const textEl  = document.getElementById('dialogue-text');
        
        console.log('  DOM 元素檢查:');
        console.log('    colorEl:', colorEl);
        console.log('    nameEl:', nameEl);
        console.log('    textEl:', textEl);

        if (colorEl) {
            colorEl.style.background = char.color;
            console.log('  ✅ 設置色塊背景:', char.color);
        }
        if (nameEl) {
            nameEl.textContent = (charaId === 'PC' ? player.name : char.name);
            nameEl.style.color = char.color;
            console.log('  ✅ 設置角色名稱:', nameEl.textContent, '顏色:', char.color);
        }
        if (textEl) {
            textEl.textContent = text;
            console.log('  ✅ 設置對話文字');
        }
        
        console.log('✅ 對話顯示完成');
    },

    // 顯示設計圖評論（對話框下方 #design-comments）
    // comments = grade_comments.csv 資料列陣列 [{grade, chara_id, comment}, ...]
    showDesignComments(comments) {
        console.log('═══════════════════════════════════');
        console.log('🗣️ DialogueSystem.showDesignComments 被呼叫');
        console.log('📥 收到的評論:', comments);
        
        const box = document.getElementById('design-comments');
        console.log('📦 #design-comments 元素:', box);
        
        if (!box) {
            console.error('❌ 找不到 #design-comments 元素！');
            return;
        }

        if (!comments || comments.length === 0) {
            console.log('⚠️ 沒有評論，隱藏評論區');
            box.style.display = 'none';
            return;
        }

        console.log(`✅ 有 ${comments.length} 條評論，開始渲染`);
        
        box.innerHTML = comments.map((c, index) => {
            console.log(`  評論 ${index + 1}:`, c);
            
            // 透過 chara_id 取得角色資料
            const char = CharacterSystem.getCharacter(c.chara_id);
            console.log(`    角色資料:`, char);
            
            const icon = char ? char.icon : '❓';
            const color = char ? char.color : '#888';
            
            return `
                <div class="comment-line">
                    <span class="comment-icon" style="color: ${color}">${icon}</span>
                    <span class="comment-text">「${c.comment}」</span>
                </div>`;
        }).join('');

        box.style.display = 'block';
        console.log('✅ 評論區顯示完成');
        console.log('═══════════════════════════════════');
    },

    hideDesignComments() {
        const box = document.getElementById('design-comments');
        if (box) box.style.display = 'none';
    }
};

window.DialogueSystem = DialogueSystem;

/**
 * CharacterSystem - 角色資料管理
 * js/systems/character.js
 */
const CharacterSystem = {

    getCharacter(charaId) {
        const char = CSVLoader.getCharacter(charaId);
        if (!char) { console.error(`找不到角色: ${charaId}`); return null; }
        return { id: char.chara_id, name: char.name, icon: char.icon, color: char.color };
    },

    // 更新左側面板的玩家顯示
    updateDisplay(playerName, playerAvatar) {
        const pc = this.getCharacter('PC');
        if (!pc) return;

        const box  = document.getElementById('avatar-box');
        const name = document.getElementById('avatar-name');
        if (box)  box.textContent = playerAvatar || pc.icon;
        if (name) { name.textContent = playerName || pc.name; name.style.color = pc.color; }
        if (box)  box.style.borderColor = pc.color;
    }
};

window.CharacterSystem = CharacterSystem;

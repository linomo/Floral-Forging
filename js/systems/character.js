// ===================================
// 角色系統 - 管理角色資料、頭像
// ===================================

const CharacterSystem = {
  // 取得角色完整資料（包含圖示、顏色）
  getCharacter(charaId) {
    const char = CSVLoader.getCharacter(charaId);
    if (!char) {
      console.error(`找不到角色: ${charaId}`);
      return null;
    }
    return {
      id: char.chara_id,
      name: char.name,           // ✅ 新名稱
      icon: char.icon,           // ✅ 新名稱
      color: char.color          // ✅ 新名稱
    };
  },

  // 取得玩家角色（會使用自訂名字和頭像）
  getPlayerCharacter(customName = null, customAvatar = null) {
    const pc = this.getCharacter('PC');
    if (!pc) return null;
    
    return {
      ...pc,
      name: customName || pc.name,
      icon: customAvatar || pc.icon
    };
  },

  // 更新角色顯示（在左側面板）
  updateDisplay(playerName, playerAvatar) {
    const pc = this.getPlayerCharacter(playerName, playerAvatar);
    if (!pc) return;
    
    const avatarBox = document.querySelector('.avatar-box');
    const avatarName = document.querySelector('.avatar-name');
    
    if (avatarBox) avatarBox.textContent = pc.icon;
    if (avatarName) {
      avatarName.textContent = pc.name;
      avatarName.style.color = pc.color;
    }
    
    // 更新頭像框邊框顏色
    if (avatarBox) {
      avatarBox.style.borderColor = pc.color;
    }
  }
};

// 匯出全域可用
window.CharacterSystem = CharacterSystem;

/**
 * EquipmentCore - 裝備系統邏輯
 * js/core/equipment.js
 */
const EquipmentCore = {

    /**
     * 取得目前裝備的物品資料
     * @returns {object|null}
     */
    getCurrentEquipment() {
        if (!player.equippedItem) return null;
        return CSVLoader.getEquipment(player.equippedItem);
    },

    /**
     * 取得玩家擁有的所有裝備
     * @returns {array}
     */
    getOwnedEquipment() {
        return CSVLoader.getOwnedEquipment(player.ownedEquipment);
    },

    /**
     * 取得未裝備的物品清單
     * @returns {array}
     */
    getUnequippedItems() {
        return this.getOwnedEquipment().filter(
            e => e.equipment_id !== player.equippedItem
        );
    },

    /**
     * 裝備物品
     * @param {string} equipmentId
     * @returns {object} { success, message, oldEquip, newEquip }
     */
    equip(equipmentId) {
        // 檢查是否擁有
        if (!player.ownedEquipment.includes(equipmentId)) {
            return { success: false, message: '你沒有這個物品！' };
        }

        const newEquip = CSVLoader.getEquipment(equipmentId);
        if (!newEquip) {
            return { success: false, message: '找不到裝備資料' };
        }

        // 如果已有裝備，先移除效果
        let oldEquip = null;
        if (player.equippedItem) {
            oldEquip = CSVLoader.getEquipment(player.equippedItem);
            this._removeEffect(oldEquip);
        }

        // 裝備新物品
        player.equippedItem = equipmentId;
        this._applyEffect(newEquip);

        return {
            success: true,
            message: `裝備了 ${newEquip.icon} ${newEquip.name}！`,
            oldEquip,
            newEquip
        };
    },

    /**
     * 卸下裝備
     * @returns {object} { success, message, oldEquip }
     */
    unequip() {
        if (!player.equippedItem) {
            return { success: false, message: '目前沒有裝備任何物品' };
        }

        const oldEquip = CSVLoader.getEquipment(player.equippedItem);
        if (oldEquip) {
            this._removeEffect(oldEquip);
        }

        player.equippedItem = null;

        return {
            success: true,
            message: oldEquip ? `卸下了 ${oldEquip.icon} ${oldEquip.name}` : '已卸下裝備',
            oldEquip
        };
    },

    /**
     * 套用裝備效果
     * @param {object} equipment
     */
    _applyEffect(equipment) {
        if (!equipment) return;
        
        const stat = equipment.effect_sta;
        const value = parseInt(equipment.effect_value) || 0;
        
        this._modifyStat(stat, value);
    },

    /**
     * 移除裝備效果
     * @param {object} equipment
     */
    _removeEffect(equipment) {
        if (!equipment) return;
        
        const stat = equipment.effect_sta;
        const value = parseInt(equipment.effect_value) || 0;
        
        this._modifyStat(stat, -value);  // 反向
    },

    /**
     * 修改玩家屬性
     * @param {string} stat
     * @param {number} value
     */
    _modifyStat(stat, value) {
        switch (stat) {
            case 'STR':
                player.str = Math.max(0, Math.min(100, player.str + value));
                break;
            case 'INT':
                player.int = Math.max(0, Math.min(100, player.int + value));
                break;
            case 'DEX':
                player.dex = Math.max(0, Math.min(100, player.dex + value));
                break;
            case 'MOOD':
                player.mood = Math.max(0, Math.min(100, player.mood + value));
                break;
            case 'STRESS':
                player.stress = Math.max(0, Math.min(100, player.stress + value));
                break;
            case 'LUCK':
                player.luck = Math.max(0, Math.min(100, player.luck + value));
                break;
        }
    },

    /**
     * 給予玩家新裝備
     * @param {string} equipmentId
     * @returns {object} { success, message, equipment }
     */
    giveEquipment(equipmentId) {
        if (player.ownedEquipment.includes(equipmentId)) {
            return { success: false, message: '已經擁有這個物品了' };
        }

        const equipment = CSVLoader.getEquipment(equipmentId);
        if (!equipment) {
            return { success: false, message: '找不到裝備資料' };
        }

        player.ownedEquipment.push(equipmentId);

        return {
            success: true,
            message: `獲得了 ${equipment.icon} ${equipment.name}！`,
            equipment
        };
    },

    /**
     * 格式化效果顯示
     * @param {string} stat
     * @param {number} value
     * @returns {string}
     */
    formatEffect(stat, value) {
        const statNames = {
            'STR': '力量',
            'INT': '智力',
            'DEX': '敏捷',
            'MOOD': '心情',
            'STRESS': '壓力',
            'LUCK': '幸運'
        };
        const name = statNames[stat] || stat;
        const sign = value >= 0 ? '+' : '';
        return `${name}${sign}${value}`;
    }
};

window.EquipmentCore = EquipmentCore;

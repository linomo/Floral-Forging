/**
 * FurnitureCore - 家具計算邏輯
 * js/core/furniture.js
 */
const FurnitureCore = {

    /**
     * 計算每旬維護費總額
     * @returns {number} 總維護費
     */
    calcTotalMaintenance() {
        let total = 0;
        Object.values(player.placedFurniture).forEach(furnitureId => {
            const furniture = CSVLoader.getFurniture(furnitureId);
            if (furniture) {
                total += parseInt(furniture.maintenance) || 0;
            }
        });
        return total;
    },

    /**
     * 結算維護費（每旬第一天呼叫）
     * - 錢夠：正常扣錢，套用正效果
     * - 錢不夠：套用反效果
     * @returns {object} { success: boolean, paid: number, effects: [] }
     */
    settleMaintenance() {
        const totalCost = this.calcTotalMaintenance();
        const effects = [];

        if (player.money >= totalCost) {
            // 錢夠，正常結算
            player.money -= totalCost;
            
            // 套用所有家具的正效果
            Object.values(player.placedFurniture).forEach(furnitureId => {
                const effect = this.applyEffect(furnitureId, false);
                if (effect) effects.push(effect);
            });

            return { success: true, paid: totalCost, effects };
        } else {
            // 錢不夠，套用反效果
            Object.values(player.placedFurniture).forEach(furnitureId => {
                const effect = this.applyEffect(furnitureId, true);
                if (effect) effects.push(effect);
            });

            return { success: false, paid: 0, effects };
        }
    },

    /**
     * 套用家具效果
     * @param {string} furnitureId - 家具 ID
     * @param {boolean} reverse - 是否反轉效果（錢不夠時）
     * @returns {object|null} { stat, value, furnitureName }
     */
    applyEffect(furnitureId, reverse = false) {
        const furniture = CSVLoader.getFurniture(furnitureId);
        if (!furniture) return null;

        const stat = furniture.effect_sta;
        let value = parseInt(furniture.effect_value) || 0;
        
        // 反轉效果
        if (reverse) value = -value;

        // 套用效果
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
            case 'CURRENTEP':
                player.currentEP = Math.max(0, player.currentEP + value);
                break;
            case 'SF_FAVOR':
                player.favor.SF = Math.max(0, Math.min(100, (player.favor.SF || 0) + value));
                break;
            case 'SS_FAVOR':
                player.favor.SS = Math.max(0, Math.min(100, (player.favor.SS || 0) + value));
                break;
            case 'DS_FAVOR':
                player.favor.DS = Math.max(0, Math.min(100, (player.favor.DS || 0) + value));
                break;
            default:
                console.warn(`未知的效果類型: ${stat}`);
                return null;
        }

        return {
            stat,
            value,
            furnitureName: furniture.name
        };
    },

    /**
     * 放置家具
     * @param {string} objId - 位置 ID（bedroom_13 等）
     * @param {string} furnitureId - 家具 ID
     * @returns {boolean} 是否成功
     */
    placeFurniture(objId, furnitureId) {
        // 檢查是否擁有此家具
        if (!player.ownedFurniture.includes(furnitureId)) {
            return false;
        }

        // 檢查家具是否已放置在其他位置
        const currentPos = Object.keys(player.placedFurniture).find(
            key => player.placedFurniture[key] === furnitureId
        );
        if (currentPos) {
            // 從原位置移除
            delete player.placedFurniture[currentPos];
        }

        // 放置到新位置
        player.placedFurniture[objId] = furnitureId;
        return true;
    },

    /**
     * 移除家具（放回倉庫）
     * @param {string} objId - 位置 ID
     * @returns {boolean} 是否成功
     */
    removeFurniture(objId) {
        if (!player.placedFurniture[objId]) {
            return false;
        }
        delete player.placedFurniture[objId];
        return true;
    },

    /**
     * 取得未放置的家具列表
     * @returns {Array} 未放置的家具資料陣列
     */
    getUnplacedFurniture() {
        const placedIds = Object.values(player.placedFurniture);
        return player.ownedFurniture
            .filter(id => !placedIds.includes(id))
            .map(id => CSVLoader.getFurniture(id))
            .filter(Boolean);
    },

    /**
     * 格式化效果顯示
     * @param {string} stat - 效果類型
     * @param {number} value - 效果值
     * @returns {string} 格式化字串
     */
    formatEffect(stat, value) {
        const statNames = {
            'STR': '力量',
            'INT': '智力',
            'DEX': '敏捷',
            'MOOD': '心情',
            'STRESS': '壓力',
            'CURRENTEP': '元氣',
// 移除好感三項
        };
        const name = statNames[stat] || stat;
        const sign = value >= 0 ? '+' : '';
        return `${name}${sign}${value}`;
    }
};

window.FurnitureCore = FurnitureCore;

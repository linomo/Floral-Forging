/**
 * StreetCore - 街道系統核心
 * js/core/street.js
 */
const StreetCore = {

    /**
     * 取得剩餘外出次數
     * @returns {number}
     */
    getRemainingVisits() {
        return player.streetVisits || 0;
    },

    /**
     * 消耗一次外出次數
     * @returns {boolean} 是否成功
     */
    useVisit() {
        if (player.streetVisits <= 0) return false;
        player.streetVisits--;
        return true;
    },

    /**
     * 重置外出次數（家庭日呼叫）
     */
    resetVisits() {
        player.streetVisits = 3;
    },

    /**
     * 執行簡單事件
     * @param {string} eventId
     * @returns {object} { success, event, effects }
     */
    executeSimpleEvent(eventId) {
        const event = CSVLoader.getStreetEvent(eventId);
        if (!event) {
            return { success: false, message: '找不到事件' };
        }

        const effects = [];

        // 處理效果 1
        if (event.effect_sta_1) {
            const value = parseInt(event.effect_value_1) || 0;
            this._applyEffect(event.effect_sta_1, value);
            effects.push({ stat: event.effect_sta_1, value });
        }

        // 處理效果 2
        if (event.effect_sta_2) {
            const value = parseInt(event.effect_value_2) || 0;
            this._applyEffect(event.effect_sta_2, value);
            effects.push({ stat: event.effect_sta_2, value });
        }

        return {
            success: true,
            event,
            effects
        };
    },

    /**
     * 套用效果
     */
    _applyEffect(stat, value) {
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
            case 'SF_FAVOR':
                player.favor.SF = Math.max(0, Math.min(100, (player.favor.SF || 0) + value));
                break;
            case 'SS_FAVOR':
                player.favor.SS = Math.max(0, Math.min(100, (player.favor.SS || 0) + value));
                break;
            case 'DS_FAVOR':
                player.favor.DS = Math.max(0, Math.min(100, (player.favor.DS || 0) + value));
                break;
            case 'MONEY':
                player.money = Math.max(0, player.money + value);
                break;
        }
    },

    /**
     * 計算裝備折扣價格（sunstreet 好感）
     * @param {number} originalPrice
     * @returns {number}
     */
    calcEquipmentPrice(originalPrice) {
        const favor = player.favor.sunstreet || 0;
        return Math.floor(originalPrice * (100 - favor) / 100);
    },

    /**
     * 計算禮品折扣價格（moonstreet 好感）
     * @param {number} originalPrice - 基本價 1000
     * @returns {number}
     */
    calcGiftPrice(originalPrice = 1000) {
        const favor = player.favor.moonstreet || 0;
        return Math.floor(originalPrice * (100 - favor) / 100);
    },

    /**
     * 計算家具折扣價格（starstreet 好感）
     * @param {number} originalPrice
     * @returns {number}
     */
    calcFurniturePrice(originalPrice) {
        const favor = player.favor.starstreet || 0;
        return Math.floor(originalPrice * (100 - favor) / 100);
    },

    /**
     * 購買禮品並送出
     * @param {string} target - 'SF' / 'SS' / 'DS'
     * @returns {object} { success, message, note }
     */
    buyAndSendGift(target) {
        const price = this.calcGiftPrice(1000);

        if (player.money < price) {
            return { success: false, message: '錢不夠！' };
        }

        player.money -= price;

        // 套用效果（不顯示數值）
        switch (target) {
            case 'SF':
                this._applyEffect('SF_FAVOR', 3);
                this._applyEffect('DS_FAVOR', 5);
                return {
                    success: true,
                    message: '禮物已送出！',
                    note: '謝謝小小徒弟，但與其花錢，不如多花點時間陪師父一起種花吧。'
                };
            case 'SS':
                this._applyEffect('SS_FAVOR', 8);
                this._applyEffect('DS_FAVOR', 5);
                return {
                    success: true,
                    message: '禮物已送出！',
                    note: '居然想到要送我禮物？良心發現了？總之還算好用。你很用心。'
                };
            case 'DS':
                this._applyEffect('DS_FAVOR', 2);
                this._applyEffect('MONEY', 100);
                return {
                    success: true,
                    message: '禮物已送出！',
                    note: '很感謝你的禮物。但我流浪在外，不方便攜帶太多東西。'
                };
            default:
                return { success: false, message: '未知對象' };
        }
    },

    /**
     * 購買裝備
     * @param {string} equipmentId
     * @returns {object} { success, message }
     */
    buyEquipment(equipmentId) {
        const equip = CSVLoader.getEquipment(equipmentId);
        if (!equip) {
            return { success: false, message: '找不到裝備' };
        }

        // 已擁有檢查
        if (player.ownedEquipment.includes(equipmentId)) {
            return { success: false, message: '已經擁有這個物品了' };
        }

        // 價格計算
        const originalPrice = parseInt(equip.price) || 0;
        const finalPrice = this.calcEquipmentPrice(originalPrice);

        if (player.money < finalPrice) {
            return { success: false, message: '錢不夠！' };
        }

        player.money -= finalPrice;
        player.ownedEquipment.push(equipmentId);

        return {
            success: true,
            message: `購買了 ${equip.icon} ${equip.name}！`,
            equipment: equip
        };
    },

    /**
     * 購買家具
     * @param {string} furnitureId
     * @returns {object} { success, message }
     */
    buyFurniture(furnitureId) {
        const furniture = CSVLoader.getFurniture(furnitureId);
        if (!furniture) {
            return { success: false, message: '找不到家具' };
        }

        // 已擁有檢查
        if (player.ownedFurniture.includes(furnitureId)) {
            return { success: false, message: '已經擁有這個家具了' };
        }

        // 價格計算
        const originalPrice = parseInt(furniture.price) || 0;
        const finalPrice = this.calcFurniturePrice(originalPrice);

        if (player.money < finalPrice) {
            return { success: false, message: '錢不夠！' };
        }

        player.money -= finalPrice;
        player.ownedFurniture.push(furnitureId);

        return {
            success: true,
            message: `購買了 ${furniture.icon} ${furniture.name}！`,
            furniture
        };
    },

    /**
     * 占卜（查看好感度和幸運值）
     * @returns {object} { success, message, data }
     */
    doFortune() {
        const cost = 500;

        if (player.money < cost) {
            return { success: false, message: '錢不夠！' };
        }

        player.money -= cost;

        return {
            success: true,
            message: '占卜完成',
            data: {
                SF_FAVOR: player.favor.SF || 0,
                SS_FAVOR: player.favor.SS || 0,
                DS_FAVOR: player.favor.DS || 0,
                LUCK: player.luck
            }
        };
    },

    /**
     * 格式化效果顯示
     */
    formatEffect(stat, value) {
        const statNames = {
            'STR': '力量',
            'INT': '智力',
            'DEX': '敏捷',
            'MOOD': '心情',
            'STRESS': '壓力',
            'LUCK': '幸運',
            'SF_FAVOR': '師父好感',
            'SS_FAVOR': '小師兄好感',
            'DS_FAVOR': '大俠好感',
            'MONEY': '金錢'
        };
        const name = statNames[stat] || stat;
        const sign = value >= 0 ? '+' : '';
        return `${name}${sign}${value}`;
    }
};

window.StreetCore = StreetCore;

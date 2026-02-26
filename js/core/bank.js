/**
 * BankCore - 存錢筒計算邏輯
 * js/core/bank.js
 */
const BankCore = {

    // === 生活品質選項 ===
    lifestyleOptions: {
        '天降大任': {
            multiplier: 0.6,
            effects: { STRESS: 10, MOOD: -10, STR: -1, INT: -1, DEX: -1 }
        },
        '毫無物慾': {
            multiplier: 1.0,
            effects: {}
        },
        '略懂略懂': {
            multiplier: 1.5,
            effects: { MOOD: 5, STR: 1 }
        },
        '我全都要': {
            multiplier: 3.0,
            effects: { MOOD: 10, STR: 1, INT: 1, DEX: 1 }
        }
    },

    // === 補貼家用選項 ===
    familyOptions: {
        '獨善其身': {
            cost: 0,
            effects: { STRESS: 10, MOOD: -10 }
        },
        '不無小補': {
            cost: 500,
            effects: { MOOD: -10, SF_FAVOR: 3, SS_FAVOR: 3 }
        },
        '家中棟樑': {
            cost: 1000,
            effects: { STRESS: -10, MOOD: 10, SF_FAVOR: 5, SS_FAVOR: 5 }
        }
    },

    // === 善心捐款選項 ===
    donationOptions: {
        '先別先別': {
            cost: 0,
            effects: {}
        },
        '意思意思': {
            cost: 100,
            effects: { MOOD: 3, DS_FAVOR: 1 }
        },
        '愛呀愛呀': {
            cost: 300,
            effects: { MOOD: 5, DS_FAVOR: 3 }
        },
        '烏拉烏拉': {
            cost: 500,
            effects: { MOOD: 10, DS_FAVOR: 5 }
        }
    },

    /**
     * 計算家具維護費總和
     * @returns {number}
     */
    calcFurnitureMaintenance() {
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
     * 計算旬生活費
     * 公式：(500 + 家具維護費) × 生活品質倍率
     * @returns {number}
     */
    calcLifestyleCost() {
        const baseCost = 500;
        const furnitureCost = this.calcFurnitureMaintenance();
        const lifestyle = this.lifestyleOptions[player.bankSettings.lifestyle];
        const multiplier = lifestyle ? lifestyle.multiplier : 1;
        return Math.floor((baseCost + furnitureCost) * multiplier);
    },

    /**
     * 計算補貼家用費
     * @returns {number}
     */
    calcFamilyCost() {
        const family = this.familyOptions[player.bankSettings.family];
        return family ? family.cost : 0;
    },

    /**
     * 計算善心捐款費
     * @returns {number}
     */
    calcDonationCost() {
        const donation = this.donationOptions[player.bankSettings.donation];
        return donation ? donation.cost : 0;
    },

    /**
     * 計算本旬總花費
     * @returns {number}
     */
    calcTotalCost() {
        return this.calcLifestyleCost() + this.calcFamilyCost() + this.calcDonationCost();
    },

    /**
     * 預覽各項費用（給 UI 顯示用）
     * @returns {object}
     */
    previewCosts() {
        return {
            lifestyle: this.calcLifestyleCost(),
            family: this.calcFamilyCost(),
            donation: this.calcDonationCost(),
            total: this.calcTotalCost(),
            furnitureMaintenance: this.calcFurnitureMaintenance()
        };
    },

    /**
     * 檢查是否付得起
     * @returns {boolean}
     */
    canAfford() {
        return player.money >= this.calcTotalCost();
    },

    /**
     * 套用效果到 player
     * @param {object} effects - { STAT: value, ... }
     */
    _applyEffects(effects) {
        if (!effects) return;
        
        Object.entries(effects).forEach(([stat, value]) => {
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
                case 'SF_FAVOR':
                    player.favor.SF = Math.max(0, Math.min(100, (player.favor.SF || 0) + value));
                    break;
                case 'SS_FAVOR':
                    player.favor.SS = Math.max(0, Math.min(100, (player.favor.SS || 0) + value));
                    break;
                case 'DS_FAVOR':
                    player.favor.DS = Math.max(0, Math.min(100, (player.favor.DS || 0) + value));
                    break;
            }
        });
    },

    /**
     * 執行旬結算（每旬開始時呼叫）
     * @returns {object} { success: boolean, message: string, costs: object, effects: [] }
     */
    settleNewPeriod() {
        const totalCost = this.calcTotalCost();
        
        // 錢不夠 → 遊戲結束
        if (player.money < totalCost) {
            return {
                success: false,
                gameOver: true,
                message: '財務管理能力太差，師父不敢讓你管理這個作坊了。',
                shortage: totalCost - player.money
            };
        }

        // 扣錢
        player.money -= totalCost;

        // 收集所有效果
        const appliedEffects = [];

        // 套用生活品質效果
        const lifestyle = this.lifestyleOptions[player.bankSettings.lifestyle];
        if (lifestyle && lifestyle.effects) {
            this._applyEffects(lifestyle.effects);
            Object.entries(lifestyle.effects).forEach(([stat, value]) => {
                appliedEffects.push({ source: '生活品質', stat, value });
            });
        }

        // 套用補貼家用效果
        const family = this.familyOptions[player.bankSettings.family];
        if (family && family.effects) {
            this._applyEffects(family.effects);
            Object.entries(family.effects).forEach(([stat, value]) => {
                appliedEffects.push({ source: '補貼家用', stat, value });
            });
        }

        // 套用善心捐款效果
        const donation = this.donationOptions[player.bankSettings.donation];
        if (donation && donation.effects) {
            this._applyEffects(donation.effects);
            Object.entries(donation.effects).forEach(([stat, value]) => {
                appliedEffects.push({ source: '善心捐款', stat, value });
            });
        }

        return {
            success: true,
            gameOver: false,
            message: `本旬生活費 ${totalCost} 元已扣除`,
            costs: this.previewCosts(),
            effects: appliedEffects
        };
    },

    /**
     * 格式化效果顯示
     * @param {string} stat
     * @param {number} value
     * @returns {string}
     */
    formatEffect(stat, value) {
    if (['SF_FAVOR', 'SS_FAVOR', 'DS_FAVOR'].includes(stat)) return null;  // 新增
    const statNames = {
        'STR': '力量', 'INT': '智力', 'DEX': '敏捷',
        'MOOD': '心情', 'STRESS': '壓力'
        // 移除 SF_FAVOR / SS_FAVOR / DS_FAVOR
    };

        const name = statNames[stat] || stat;
        const sign = value >= 0 ? '+' : '';
        return `${name}${sign}${value}`;
    }
};

window.BankCore = BankCore;

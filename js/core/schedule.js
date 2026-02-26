/**
 * ScheduleCore - 排程系統核心
 * js/core/schedule.js
 */
const ScheduleCore = {

    // === 瓶頸係數表 ===
    getBottleneckFactor(statValue) {
        if (statValue <= 30) return 1.0;
        if (statValue <= 60) return 0.6;
        if (statValue < 100) return 0.4;
        return 0;  // 100 以上停止成長
    },

    /**
     * 取得所有行動
     * @returns {array}
     */
    getAllActions() {
        return CSVLoader.getActions();
    },

    /**
     * 取得廬內行動
     * @returns {array}
     */
    getIndoorActions() {
        return CSVLoader.getActions('廬內');
    },

    /**
     * 取得廬外行動
     * @returns {array}
     */
    getOutdoorActions() {
        return CSVLoader.getActions('廬外');
    },

    /**
     * 計算排程剩餘天數
     * @param {array} schedule - 目前排程 [action_id, ...]
     * @returns {number}
     */
    getRemainingDays(schedule) {
        let usedDays = 0;
        schedule.forEach(actionId => {
            const action = CSVLoader.getAction(actionId);
            if (action) usedDays += parseInt(action.days) || 0;
        });
        return 9 - usedDays;
    },

    /**
     * 檢查是否可加入行動
     * @param {array} schedule - 目前排程
     * @param {string} actionId - 要加入的行動
     * @returns {object} { canAdd, reason }
     */
    canAddAction(schedule, actionId) {
        const action = CSVLoader.getAction(actionId);
        if (!action) return { canAdd: false, reason: '找不到行動' };

        const days = parseInt(action.days) || 0;
        const remaining = this.getRemainingDays(schedule);

        if (days > remaining) {
            return { canAdd: false, reason: `天數不足（需要 ${days} 天，剩餘 ${remaining} 天）` };
        }

        return { canAdd: true, reason: '' };
    },

    /**
     * 執行單一行動效果
     * @param {string} actionId
     * @returns {object} { effects: [], message }
     */
    executeAction(actionId) {
        const action = CSVLoader.getAction(actionId);
        if (!action) return { effects: [], message: '找不到行動' };

        const effects = [];

        // 處理三個效果欄位
        for (let i = 1; i <= 3; i++) {
            const stat = action[`effect_sta_${i}`];
            const value = parseInt(action[`effect_value_${i}`]) || 0;
            const useFactor = action[`use_factor_${i}`] === 'TRUE' || action[`use_factor_${i}`] === 'true';

            if (stat && value !== 0) {
                let finalValue = value;

                // 套用瓶頸係數
                if (useFactor) {
                    const currentStat = this._getPlayerStat(stat);
                    const factor = this.getBottleneckFactor(currentStat);
                    finalValue = Math.floor(value * factor);
                }

                // 套用效果
                this._applyEffect(stat, finalValue);
                effects.push({ stat, value: finalValue, usedFactor: useFactor });
            }
        }

        return {
            effects,
            message: `執行了「${action.name}」`,
            action
        };
    },

    /**
     * 取得玩家屬性值
     */
    _getPlayerStat(stat) {
        switch (stat) {
            case 'STR': return player.str;
            case 'INT': return player.int;
            case 'DEX': return player.dex;
            case 'MOOD': return player.mood;
            case 'STRESS': return player.stress;
            case 'LUCK': return player.luck;
            default: return 0;
        }
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
        }
    },

    // ===========================
    // 採集系統
    // ===========================

    /**
     * 計算採集掉落
     * @param {string} actionParam - gather_mountain_near / gather_forest_far / gather_market 等
     * @returns {object} { type, amount, message }
     */
    calcGatherResult(actionParam) {
        const random30 = Math.floor(Math.random() * 31);  // 0~30
        const statSum = player.int + player.str + player.dex;

        let type = '';
        let amount = 0;

        switch (actionParam) {
            case 'gather_mountain_near':
                // 近山：原礦，(INT+STR+DEX)/3 - random(0,30)
                type = 'metal';
                amount = Math.floor(statSum / 3 - random30);
                break;

            case 'gather_mountain_far':
                // 遠山：原礦，(INT+STR+DEX - random(0,30)) * LUCK/100
                type = 'metal';
                amount = Math.floor((statSum - random30) * player.luck / 100);
                break;

            case 'gather_forest_near':
                // 近林：原木，(INT+STR+DEX)/3 - random(0,30)
                type = 'wood';
                amount = Math.floor(statSum / 3 - random30);
                break;

            case 'gather_forest_far':
                // 遠林：原木，(INT+STR+DEX - random(0,30)) * LUCK/100
                type = 'wood';
                amount = Math.floor((statSum - random30) * player.luck / 100);
                break;

            case 'gather_market':
                // 市場：金錢，(INT - random(0,30)) * LUCK/100
                type = 'money';
                amount = Math.floor((player.int - random30) * player.luck / 100);
                break;

            default:
                return { type: 'none', amount: 0, message: '未知地點' };
        }

        // 最少 0
        amount = Math.max(0, amount);

        // 給予獎勵
        const message = this._giveGatherReward(type, amount);

        return { type, amount, message };
    },

    /**
     * 給予採集獎勵
     */
    _giveGatherReward(type, amount) {
        if (amount <= 0) return '什麼都沒找到...';

        switch (type) {
            case 'metal':
                // 給 m00（原礦）
                player.materials.metal.m00 = (player.materials.metal.m00 || 0) + amount;
                return `獲得原礦 ×${amount}`;

            case 'wood':
                // 給 w00（原木）
                player.materials.wood.w00 = (player.materials.wood.w00 || 0) + amount;
                return `獲得原木 ×${amount}`;

            case 'money':
                player.money += amount;
                return `撿到 ${amount} 元`;

            default:
                return '';
        }
    },

    /**
     * 執行整個旬的排程
     * @param {array} schedule - [action_id, action_id, ...]
     * @returns {array} 執行結果陣列
     */
    executeSchedule(schedule) {
        const results = [];

        schedule.forEach((actionId, index) => {
            const action = CSVLoader.getAction(actionId);
            if (!action) return;

            // 執行基本效果
            const result = this.executeAction(actionId);
            result.index = index + 1;
            result.actionName = action.name;
            result.icon = action.icon;

            // 如果是採集類，計算掉落
            if (action.action_type === 'open_modal' && action.action_param?.startsWith('gather_')) {
                const gatherResult = this.calcGatherResult(action.action_param);
                result.gather = gatherResult;
            }

            // 如果是鍛造，標記需要進入鍛造室
            if (action.action_param === 'forge_modal') {
                result.needForge = true;
            }

            results.push(result);
        });

        return results;
    }
};

window.ScheduleCore = ScheduleCore;

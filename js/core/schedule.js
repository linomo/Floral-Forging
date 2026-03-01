/**
 * ScheduleCore - 排程系統核心
 * js/core/schedule.js
 */
const ScheduleCore = {

    getBottleneckFactor(statValue) {
        if (statValue <= 30) return 1.0;
        if (statValue <= 60) return 0.6;
        if (statValue < 100) return 0.4;
        return 0;
    },

    getAllActions()    { return CSVLoader.getActions(); },
    getIndoorActions() { return CSVLoader.getActions('廬內'); },
    getOutdoorActions() { return CSVLoader.getActions('廬外'); },

    getRemainingDays(schedule) {
        let usedDays = 0;
        schedule.forEach(actionId => {
            const action = CSVLoader.getAction(actionId);
            if (action) usedDays += parseInt(action.days) || 0;
        });
        return 9 - usedDays;
    },

    canAddAction(schedule, actionId) {
        const action = CSVLoader.getAction(actionId);
        if (!action) return { canAdd: false, reason: '找不到行動' };

        const days = parseInt(action.days) || 0;
        const remaining = this.getRemainingDays(schedule);

        if (actionId === 'act_01') {
            if (schedule.includes('act_01'))
                return { canAdd: false, reason: '鍛造每旬只能安排一次' };
            if (remaining !== 6)
                return { canAdd: false, reason: `鍛造需要剩餘恰好 6 天（目前剩 ${remaining} 天）` };
            return { canAdd: true, reason: '' };
        }

        if (schedule.includes('act_01'))
            return { canAdd: false, reason: '鍛造已排定，無法新增其他行程' };

        if (days > remaining)
            return { canAdd: false, reason: `天數不足（需要 ${days} 天，剩餘 ${remaining} 天）` };

        return { canAdd: true, reason: '' };
    },

    executeAction(actionId) {
        const action = CSVLoader.getAction(actionId);
        if (!action) return { effects: [] };

        const effects = [];
        for (let i = 1; i <= 3; i++) {
            const stat = action[`effect_sta_${i}`];
            const value = parseInt(action[`effect_value_${i}`]) || 0;
            const useFactor = action[`use_factor_${i}`] === 'TRUE' || action[`use_factor_${i}`] === 'true';

            if (stat && value !== 0) {
                let finalValue = value;
                if (useFactor) {
                    const factor = this.getBottleneckFactor(this._getPlayerStat(stat));
                    finalValue = Math.floor(value * factor);
                }
                this._applyEffect(stat, finalValue);
                effects.push({ stat, value: finalValue });
            }
        }
        return { effects, action };
    },

    _getPlayerStat(stat) {
        switch (stat) {
            case 'STR':      return player.str;
            case 'INT':      return player.int;
            case 'DEX':      return player.dex;
            case 'MOOD':     return player.mood;
            case 'STRESS':   return player.stress;
            case 'LUCK':     return player.luck;
            case 'MONEY':    return player.money;
            case 'SF_FAVOR': return player.favor.SF || 0;
            case 'SS_FAVOR': return player.favor.SS || 0;
            case 'DS_FAVOR': return player.favor.DS || 0;
            default:         return 0;
        }
    },

    _applyEffect(stat, value) {
        switch (stat) {
            case 'STR':
                player.str    = Math.max(0, Math.min(100, player.str    + value)); break;
            case 'INT':
                player.int    = Math.max(0, Math.min(100, player.int    + value)); break;
            case 'DEX':
                player.dex    = Math.max(0, Math.min(100, player.dex    + value)); break;
            case 'MOOD':
                player.mood   = Math.max(0, Math.min(100, player.mood   + value)); break;
            case 'STRESS':
                player.stress = Math.max(0, Math.min(100, player.stress + value)); break;
            case 'LUCK':
                player.luck   = Math.max(0, Math.min(100, player.luck   + value)); break;
            case 'MONEY':
                player.money  = Math.max(0, player.money + value); break;
            case 'SF_FAVOR':
                player.favor.SF = Math.max(0, Math.min(100, (player.favor.SF || 0) + value)); break;
            case 'SS_FAVOR':
                player.favor.SS = Math.max(0, Math.min(100, (player.favor.SS || 0) + value)); break;
            case 'DS_FAVOR':
                player.favor.DS = Math.max(0, Math.min(100, (player.favor.DS || 0) + value)); break;
        }
    },

    // ===========================
    // 行程隨機事件
    // ===========================

    /**
     * 抽選並執行行程隨機事件
     * 總權重固定 100，剩餘為「沒遇到事件」
     * @returns {object|null}
     */
    rollScheduleEvent(actionId) {
        const events = CSVLoader.getScheduleEvents(actionId);
        if (!events || events.length === 0) return null;

        const roll = Math.floor(Math.random() * 100) + 1;  // 1~100

        let cumulative = 0;
        let triggered = null;
        for (const evt of events) {
            cumulative += parseInt(evt.trigger_chance) || 0;
            if (roll <= cumulative) { triggered = evt; break; }
        }

        if (!triggered) return null;  // 落在剩餘 40% → 沒遇到

        // 判斷成功或失敗
        const current = this._getPlayerStat(triggered.condition_stat);
        const condVal = parseInt(triggered.condition_value) || 0;
        const success = triggered.condition_op === 'gte'
            ? current >= condVal
            : current < condVal;

        const stat  = success ? triggered.success_stat        : triggered.fail_stat;
        const value = success ? parseInt(triggered.success_value) : parseInt(triggered.fail_value);
        const text  = success ? triggered.success_text        : triggered.fail_text;

        if (stat && !isNaN(value) && value !== 0) {
            this._applyEffect(stat, value);
        }

        return {
            name:    triggered.name,
            desc:    triggered.description,
            text,
            success,
            stat:    stat || null,
            value:   isNaN(value) ? 0 : value,
            charaId: triggered.chara_id || ''
        };
    },

    // ===========================
    // 採集系統
    // ===========================

    calcGatherResult(actionParam) {
        const random30 = Math.floor(Math.random() * 31);
        const statSum = player.int + player.str + player.dex;
        let type = '', amount = 0;

        switch (actionParam) {
            case 'gather_mountain_near': type = 'metal'; amount = Math.floor(statSum / 3 - random30); break;
            case 'gather_mountain_far':  type = 'metal'; amount = Math.floor((statSum - random30) * player.luck / 100); break;
            case 'gather_forest_near':   type = 'wood';  amount = Math.floor(statSum / 3 - random30); break;
            case 'gather_forest_far':    type = 'wood';  amount = Math.floor((statSum - random30) * player.luck / 100); break;
            case 'gather_market':        type = 'money'; amount = Math.floor((player.int - random30) * player.luck / 100); break;
            default: return { type: 'none', amount: 0, message: '未知地點' };
        }

        amount = Math.max(0, amount);
        return { type, amount, message: this._giveGatherReward(type, amount) };
    },

    _giveGatherReward(type, amount) {
        if (amount <= 0) return '什麼都沒找到……';
        switch (type) {
            case 'metal':
                player.materials.metal.m00 = (player.materials.metal.m00 || 0) + amount;
                return `獲得原礦 ×${amount}`;
            case 'wood':
                player.materials.wood.w00 = (player.materials.wood.w00 || 0) + amount;
                return `獲得原木 ×${amount}`;
            case 'money':
                player.money += amount;
                return `撿到 ${amount} 元`;
            default: return '';
        }
    },

    executeSchedule(schedule) {
        const results = [];

        schedule.forEach((actionId, index) => {
            const action = CSVLoader.getAction(actionId);
            if (!action) return;

            if (actionId === 'act_01') {
                results.push({ index: index + 1, actionName: action.name, icon: action.icon, effects: [], event: null, needForge: true });
                return;
            }

            const result = this.executeAction(actionId);
            result.index = index + 1;
            result.actionName = action.name;
            result.icon = action.icon;

            if (action.action_type === 'open_modal' && action.action_param?.startsWith('gather_')) {
                result.gather = this.calcGatherResult(action.action_param);
            }

            result.event = this.rollScheduleEvent(actionId);

            results.push(result);
        });

        return results;
    }
};

window.ScheduleCore = ScheduleCore;

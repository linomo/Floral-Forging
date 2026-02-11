/**
 * CommissionCore - 委託計算邏輯
 * js/core/commission.js
 */
const CommissionCore = {

    // 取委託所屬街道
    getStreet(commissionId) {
        const num = parseInt(commissionId.replace('miss', ''));
        if (num >= 1  && num <= 5)  return 'sunstreet';
        if (num >= 6  && num <= 10) return 'moonstreet';
        if (num >= 11 && num <= 15) return 'starstreet';
        return null;
    },

    // 街道顯示名稱
    getStreetName(streetKey) {
        const map = { sunstreet: '日出街', moonstreet: '月落路', starstreet: '銀河道' };
        return map[streetKey] || streetKey;
    },

    // 隨機抽 3 個不重複委託（從全部 pool 中取）
    drawCommissions(allCommissions) {
        const shuffled = [...allCommissions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3).map(c => c.commission_id);
    },

    // 取材料顯示資料（固定顯示金＋木，無需求填零）
    getMaterialDisplay(commission) {
        const itemId  = (commission.item_id     || '').trim();
        const demand  = parseInt(commission.item_demand) || 0;
        const isMetal = itemId.startsWith('m') && itemId !== '';
        const isWood  = itemId.startsWith('w') && itemId !== '';

        let metalName = '金屬', metalDemand = 0;
        let woodName  = '木材', woodDemand  = 0;

        if (isMetal && demand > 0) {
            const mat = CSVLoader.data.metal.find(m => m.m_id === itemId);
            metalName   = mat ? mat.name : itemId;
            metalDemand = demand;
        }
        if (isWood && demand > 0) {
            const mat = CSVLoader.data.wood.find(w => w.w_id === itemId);
            woodName   = mat ? mat.name : itemId;
            woodDemand = demand;
        }

        return { metalName, metalDemand, woodName, woodDemand };
    },

    // 檢查玩家是否可執行委託
    canExecute(commission, player) {
        const epCost = parseInt(commission.commission_ep) || 0;
        if (player.currentEP < epCost) return false;

        const itemId = (commission.item_id || '').trim();
        const demand = parseInt(commission.item_demand) || 0;
        if (!itemId || demand === 0) return true;

        const isMetal = itemId.startsWith('m');
        const have    = isMetal
            ? (player.materials.metal[itemId] || 0)
            : (player.materials.wood[itemId]  || 0);
        return have >= demand;
    },

    // 執行委託（直接修改 player 資料）
    execute(commission, player) {
        const epCost = parseInt(commission.commission_ep) || 0;
        const demand = parseInt(commission.item_demand)   || 0;
        const reward = parseInt(commission.reward)        || 0;
        const itemId = (commission.item_id || '').trim();

        // 扣除 EP
        player.currentEP -= epCost;

        // 扣除材料
        if (itemId && demand > 0) {
            if (itemId.startsWith('m')) player.materials.metal[itemId] = (player.materials.metal[itemId] || 0) - demand;
            else                        player.materials.wood[itemId]  = (player.materials.wood[itemId]  || 0) - demand;
        }

        // 給予報酬
        player.money += reward;

        // MOOD +3
        player.mood = Math.min(100, (player.mood || 0) + 3);

        // 街道好感 +1
        const street = this.getStreet(commission.commission_id);
        if (street && player.favor[street] !== undefined) {
            player.favor[street] = Math.min(100, (player.favor[street] || 0) + 1);
        }
    }
};

window.CommissionCore = CommissionCore;

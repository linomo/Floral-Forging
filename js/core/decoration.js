/**
 * DecorationCore - 裝飾計算邏輯
 * js/core/decoration.js
 *
 * 隨機數 = Math.floor(Random(0~8)) + INT/50
 * 對照倍率表計算成品新售價
 */
const DecorationCore = {

    // 倍率表：randomNum < max 時套用對應倍率
    _table: [
        { max: 2,        rates: { 10: 0.2, 30: 0.2,  100: 0.2 } },
        { max: 5,        rates: { 10: 0.5, 30: 0.6,  100: 0.8 } },
        { max: 7,        rates: { 10: 1.0, 30: 1.0,  100: 1.0 } },
        { max: 9,        rates: { 10: 1.2, 30: 1.8,  100: 2.0 } },
        { max: Infinity, rates: { 10: 1.5, 30: 2.0,  100: 3.0 } },
    ],

    /** EP消耗 = Math.round(15 - MOOD/100)，最低 0 */
    calcEP(mood) {
        return Math.max(0, Math.round(15 - (mood / 100)));
    },

    /** 抽隨機數：floor(0~8) + INT/50 */
    rollRandom(int) {
        return Math.floor(Math.random() * 9) + (int / 50);
    },

    /** 查倍率表 */
    getMultiplier(randomNum, cost) {
        for (const row of this._table) {
            if (randomNum < row.max) return row.rates[cost] ?? 1;
        }
        return 1;
    }
};

window.DecorationCore = DecorationCore;

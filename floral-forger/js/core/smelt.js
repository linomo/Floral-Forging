/**
 * SmeltCore - 冶煉計算邏輯
 * js/core/smelt.js
 *
 * 計算邏輯目前內嵌於 SmeltUI，此模組為未來抽離預留。
 */
const SmeltCore = {
    /** EP消耗 = ceil(數量 / (str+dex) * 60) */
    calcEP(amount, str, dex) {
        if (amount === 0) return 0;
        return Math.ceil(amount / (str + dex) * 60);
    },

    /** 處理產出量 = floor(數量 * int / 100) */
    calcProcessOutput(amount, int) {
        return Math.floor(amount * int / 100);
    },

    /** 分解倍率：奇×2、好×1.5、普×1.33 */
    decomposeRatio(grade) {
        return { '奇': 2, '好': 1.5, '普': 1.33 }[grade] || 1;
    }
};

window.SmeltCore = SmeltCore;

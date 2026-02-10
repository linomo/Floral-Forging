/**
 * DecorationCore - 裝飾計算邏輯（待開發）
 * js/core/decoration.js
 */
const DecorationCore = {
    /** 裝飾加價（+10/+30/+50元）*/
    calcBonus(tier) {
        return { 1: 10, 2: 30, 3: 50 }[tier] || 0;
    }
};

window.DecorationCore = DecorationCore;

/**
 * CraftingCore - 鍛造計算邏輯
 * js/core/crafting.js
 *
 * 計算邏輯目前內嵌於 CraftingUI，此模組為未來抽離預留。
 */
const CraftingCore = {
    /** EP消耗 = max(0, 設計圖EP - floor(STR/20)) */
    calcEP(designEP, str) {
        return Math.max(0, designEP - Math.floor(str / 20));
    },

    /** 售價 = (金×金單價 + 木×木單價) × 武器倍率 × 物理倍率 */
    calcSellPrice(metalNeed, woodNeed, metalPrice, woodPrice, weaponMulti, physicalMulti) {
        return Math.floor((metalNeed * metalPrice + woodNeed * woodPrice) * weaponMulti * physicalMulti);
    }
};

window.CraftingCore = CraftingCore;

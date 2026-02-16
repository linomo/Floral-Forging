/**
 * ShopCore - 販售計算邏輯
 * js/core/shop.js
 */
const ShopCore = {

    /**
     * 計算販售倍率（打開 Modal 時呼叫一次）
     * 公式：
     * - 最低倍率 = 1 - (100 - INT) / 1000
     * - 最高倍率 = 1 + LUCK / 1000
     * - 實際倍率 = random(最低, 最高)
     */
    calcMultiplier(int, luck) {
        const minRate = 1 - (100 - int) / 1000;
        const maxRate = 1 + luck / 1000;
        const actualRate = minRate + Math.random() * (maxRate - minRate);
        return parseFloat(actualRate.toFixed(2));
    },

    /**
     * 計算材料售價（10 個一組）
     * @param {object} material - metal.csv 或 wood.csv 資料
     * @param {number} multiplier - 倍率
     * @returns {number} 售價（已取整）
     */
    calcMaterialPrice(material, multiplier) {
        const basePrice = parseInt(material.price) || 0;
        return Math.floor(basePrice * 10 * multiplier);
    },

    /**
     * 計算設計圖售價
     * @param {object} design - player.designs 設計圖物件
     * @param {number} multiplier - 倍率
     * @returns {number} 售價（已取整）
     */
    calcDesignPrice(design, multiplier) {
        const basePrice = parseInt(design.blueprintPrice) || 0;
        return Math.floor(basePrice * multiplier);
    },

    /**
     * 計算成品售價
     * @param {object} product - player.products 成品物件
     * @param {number} multiplier - 倍率
     * @returns {number} 售價（已取整）
     */
    calcProductPrice(product, multiplier) {
        const basePrice = parseInt(product.sellPrice) || 0;
        return Math.floor(basePrice * multiplier);
    },

    /**
     * 檢查大俠收購事件
     * - 條件：品級為「奇」（非奇‽）
     * - 機率：10%
     * @param {string} grade - 品級（爛/普/好/奇/奇‽）
     * @returns {boolean} 是否觸發大俠收購
     */
    checkDaxiaEvent(grade) {
        if (grade !== '奇') return false;
        return Math.random() < 0.1;
    },

    /**
     * 計算大俠收購價格
     * @param {number} normalPrice - 原價 × 倍率
     * @returns {number} 大俠價（原價 × 2）
     */
    calcDaxiaPrice(normalPrice) {
        return normalPrice * 2;
    }
};

window.ShopCore = ShopCore;

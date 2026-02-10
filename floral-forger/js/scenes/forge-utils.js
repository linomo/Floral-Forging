/**
 * ForgeUtils - 書架、庫存、打掃
 * js/scenes/forge-utils.js
 */
const ForgeUtils = {

    // === 打掃 ===
    cleanRoom(epCost) {
        if (player.dirtiness === 0) {
            showToast('✨ 很乾淨了！');
            DialogueSystem.showDialogue('PC', '很乾淨了！再清下去，小師兄會覺得我們搞破壞！');
            return;
        }
        if (player.currentEP < epCost) {
            showToast('⚡ 元氣不足，無法打掃！');
            return;
        }
        const cleanAmount = 50;
        player.currentEP -= epCost;
        player.dirtiness  = Math.max(0, player.dirtiness - cleanAmount);
        updateStatsDisplay();
        showToast(`✨ 打掃完成！汙穢值 -${cleanAmount}（消耗 ${epCost} EP）`);
    },

    // =========================================
    // === 材料庫存彈窗
    // =========================================
    openInventory() {
        const modal = document.getElementById('inventoryModal');
        if (!modal) { console.error('inventoryModal 不存在！'); return; }

        let html = '<div class="inventory-content">';

        // 金屬材料
        html += '<div class="inventory-section"><div class="inventory-title">【金屬】</div><div class="inventory-items">';
        const metalItems = [];
        Object.keys(player.materials.metal).forEach(id => {
            const amount = player.materials.metal[id];
            const mat = CSVLoader.data.metal.find(m => m.m_id === id);
            if (mat) metalItems.push(`${mat.name}×${amount}`);
        });
        html += metalItems.join(' | ') + '</div></div>';

        // 木材
        html += '<div class="inventory-section"><div class="inventory-title">【木材】</div><div class="inventory-items">';
        const woodItems = [];
        Object.keys(player.materials.wood).forEach(id => {
            const amount = player.materials.wood[id];
            const mat = CSVLoader.data.wood.find(w => w.w_id === id);
            if (mat) woodItems.push(`${mat.name}×${amount}`);
        });
        html += woodItems.join(' | ') + '</div></div>';

        // 設計圖
        html += `<div class="inventory-section"><div class="inventory-title">【設計圖】${player.designs.length} 張</div><div class="inventory-list">`;
        player.designs.forEach(d => {
            const chNum = ForgeScene.toChineseNumber(d.id);
            html += `<div class="inventory-item">${chNum} ${d.grade}！${d.physical}${d.mental}${d.weapon} 💰${d.blueprintPrice}元</div>`;
        });
        if (player.designs.length === 0) html += '<div class="inventory-empty">還沒有設計圖</div>';
        html += '</div></div>';

        // 成品劍
        html += `<div class="inventory-section"><div class="inventory-title">【成品】${player.products.length} 把</div><div class="inventory-list">`;
        player.products.forEach(p => {
            const chNum = ForgeScene.toChineseNumber(p.id);
            html += `<div class="inventory-item">${chNum} ${p.grade}！${p.physical}${p.mental}${p.weapon} 💰${p.sellPrice || '?'}元</div>`;
        });
        if (player.products.length === 0) html += '<div class="inventory-empty">還沒有成品劍</div>';
        html += '</div></div></div>';

        const modalContent = modal.querySelector('.inventory-modal-content') || modal;
        modalContent.innerHTML = html;
        modal.classList.add('show');
    },

    closeInventory() {
        const modal = document.getElementById('inventoryModal');
        if (modal) modal.classList.remove('show');
    },

    // =========================================
    // === 書架系統
    // =========================================
    _initBookStyles() {
        if (document.getElementById('book-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'book-system-styles';
        style.textContent = `
            .book-modal { background: linear-gradient(180deg, #252535 0%, #1a1a28 100%); border-radius: 16px; padding: 20px; max-width: 400px; width: 90%; max-height: 70vh; overflow-y: auto; }
            .book-list { display: flex; flex-direction: column; gap: 10px; margin: 15px 0; }
            .book-item { padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center; }
            .book-item:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
            .book-item-name { font-size: 1.1em; font-weight: bold; color: #f5a623; }
            .book-scroll { background: linear-gradient(180deg, #3a3a4a 0%, #2a2a38 100%); border-radius: 12px; max-width: 400px; width: 90%; border: 3px solid #556b2f; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
            .book-scroll-header { background: linear-gradient(180deg, #556b2f, #6b8e23); padding: 20px; text-align: center; border-radius: 9px 9px 0 0; display: flex; align-items: center; justify-content: center; }
            .book-scroll-title { font-size: 1.5em; font-weight: bold; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
            .book-scroll-meta { display: flex; justify-content: space-around; padding: 15px 20px; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(85,107,47,0.3); border-bottom: 1px solid rgba(85,107,47,0.3); }
            .book-scroll-meta-item { text-align: center; color: #ccc; font-size: 0.95em; }
            .book-scroll-meta-label { color: #888; margin-right: 5px; }
            .book-scroll-content { padding: 25px 30px; text-align: center; line-height: 1.8; color: #ddd; font-size: 1em; min-height: 100px; }
            .book-scroll-footer { padding: 20px; text-align: center; background: rgba(0,0,0,0.1); border-radius: 0 0 9px 9px; }
            .book-read-btn { padding: 12px 40px; font-size: 1.1em; background: linear-gradient(90deg, #f5a623, #f5576c); border: none; border-radius: 10px; color: #fff; cursor: pointer; font-weight: bold; transition: all 0.2s; }
            .book-read-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(245,166,35,0.4); }
            .book-read-btn:disabled { background: rgba(255,255,255,0.1); color: #666; cursor: not-allowed; }
            .book-read-btn:disabled:hover { transform: none; box-shadow: none; }
            .book-status-read { color: #7ed321; font-weight: bold; }
            .book-status-unread { color: #f5576c; font-weight: bold; }
        `;
        document.head.appendChild(style);
    },

    openBookModal() {
        this._initBookStyles();
        let modal = document.getElementById('bookModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bookModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        const playerBooks = player.books || [];
        if (playerBooks.length === 0) {
            modal.innerHTML = `
                <div class="book-modal">
                    <div class="modal-title">📚 書架</div>
                    <div style="padding:40px;text-align:center;color:#666">還沒有任何書籍...</div>
                    <div class="modal-actions"><button class="modal-btn primary" onclick="ForgeUtils.closeBookModal()">關閉</button></div>
                </div>`;
        } else {
            let booksHtml = '<div class="book-list">';
            playerBooks.forEach(bookId => {
                const book = CSVLoader.data.books.find(b => b.book_id === bookId);
                if (book) {
                    booksHtml += `<div class="book-item" onclick="ForgeUtils.openBookScroll('${bookId}')"><div class="book-item-name">📖 ${book.name}</div></div>`;
                }
            });
            booksHtml += '</div>';
            modal.innerHTML = `
                <div class="book-modal">
                    <div class="modal-title">📚 書架</div>
                    ${booksHtml}
                    <div class="modal-actions"><button class="modal-btn primary" onclick="ForgeUtils.closeBookModal()">關閉</button></div>
                </div>`;
        }
        modal.classList.add('show');
    },

    closeBookModal() {
        const modal = document.getElementById('bookModal');
        if (modal) modal.classList.remove('show');
    },

    openBookScroll(bookId) {
        this._initBookStyles();
        const book = CSVLoader.data.books.find(b => b.book_id === bookId);
        if (!book) { console.error(`找不到書籍: ${bookId}`); return; }

        const isRead = player.readBooks.includes(bookId);
        const epCost = parseInt(book.read_ep) || 0;

        let scrollModal = document.getElementById('bookScrollModal');
        if (!scrollModal) {
            scrollModal = document.createElement('div');
            scrollModal.id = 'bookScrollModal';
            scrollModal.className = 'modal-overlay';
            document.body.appendChild(scrollModal);
        }

        scrollModal.innerHTML = `
            <div class="book-scroll">
                <div class="book-scroll-header"><div class="book-scroll-title">${book.name}</div></div>
                <div class="book-scroll-meta">
                    <div class="book-scroll-meta-item"><span class="book-scroll-meta-label">⚡ EP：</span><span>${epCost}</span></div>
                    <div class="book-scroll-meta-item"><span class="${isRead ? 'book-status-read' : 'book-status-unread'}">${isRead ? '已閱讀' : '未閱讀'}</span></div>
                </div>
                <div class="book-scroll-content">${book.description}</div>
                <div class="book-scroll-footer">
                    ${isRead
                        ? '<button class="book-read-btn" disabled>已讀過</button>'
                        : `<button class="book-read-btn" onclick="ForgeUtils.readBook('${bookId}')">閱讀</button>`
                    }
                    <button class="book-read-btn" style="background:rgba(255,255,255,0.1);margin-top:10px;" onclick="ForgeUtils.closeBookScroll()">返回</button>
                </div>
            </div>`;

        this.closeBookModal();
        scrollModal.classList.add('show');
    },

    closeBookScroll() {
        const modal = document.getElementById('bookScrollModal');
        if (modal) modal.classList.remove('show');
    },

    readBook(bookId) {
        const book = CSVLoader.data.books.find(b => b.book_id === bookId);
        if (!book) { console.error(`找不到書籍: ${bookId}`); return; }

        const epCost = parseInt(book.read_ep) || 0;
        if (player.currentEP < epCost) { showToast('⚡ 元氣不足，無法閱讀！'); return; }

        player.currentEP -= epCost;
        if (!player.readBooks.includes(bookId)) player.readBooks.push(bookId);

        const unlockedWeapons = CSVLoader.data.weapons.filter(w => w.unlock_book === bookId);
        unlockedWeapons.forEach(w => {
            if (!player.unlockedWeapons.includes(w.wea_id)) player.unlockedWeapons.push(w.wea_id);
        });

        updateStatsDisplay();

        if (unlockedWeapons.length > 0) {
            const names = unlockedWeapons.map(w => w.name).join('、');
            showToast(`📖 讀完《${book.name}》！解鎖武器：${names}`);
            DialogueSystem.showDialogue('PC', `太好了！學會了 ${names} 的製作方法！`);
        } else {
            showToast(`📖 讀完《${book.name}》！`);
            DialogueSystem.showDialogue('PC', '嗯...雖然沒學到新武器，但還是有收穫的！');
        }

        this.closeBookScroll();
    }
};

window.ForgeUtils = ForgeUtils;

// HTML onclick 相容
function closeInventoryModal() { ForgeUtils.closeInventory(); }

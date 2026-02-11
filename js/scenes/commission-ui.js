/**
 * CommissionUI - 委託彈窗
 * js/scenes/commission-ui.js
 */
const CommissionUI = {

    _initStyles() {
        if (document.getElementById('commission-system-styles')) return;
        const style = document.createElement('style');
        style.id = 'commission-system-styles';
        style.textContent = `
            /* === 委託板子（列表） === */
            .commission-board-modal {
                background: linear-gradient(180deg, #252535 0%, #1a1a28 100%);
                border-radius: 16px; padding: 20px;
                max-width: 400px; width: 90%; max-height: 70vh; overflow-y: auto;
            }
            .commission-list {
                display: flex; flex-direction: column; gap: 10px; margin: 15px 0;
            }
            .commission-item {
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center;
            }
            .commission-item:hover:not(.done) {
                background: rgba(255,255,255,0.1);
                border-color: rgba(255,255,255,0.3); transform: translateY(-2px);
            }
            .commission-item.done {
                opacity: 0.45; cursor: default;
            }
            .commission-item-client {
                font-size: 1em; font-weight: bold; color: #f5a623; margin-bottom: 5px;
            }
            .commission-item-reward {
                font-size: 0.9em; color: #ccc;
            }
            .commission-done-badge {
                display: inline-block;
                padding: 1px 8px; margin-left: 8px;
                background: rgba(126,211,33,0.15);
                border: 1px solid rgba(126,211,33,0.3);
                border-radius: 8px; font-size: 0.8em; color: #7ed321;
            }
            .commission-empty {
                text-align: center; color: #555; padding: 30px 0; font-size: 0.9em;
            }

            /* === 委託詳細（捲軸） === */
            .commission-scroll {
                background: linear-gradient(180deg, #3a3a4a 0%, #2a2a38 100%);
                border-radius: 12px; max-width: 400px; width: 90%;
                border: 3px solid #7a6840;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            }
            .commission-scroll-header {
                background: linear-gradient(180deg, #7a6840, #9a8450);
                padding: 18px 20px; border-radius: 9px 9px 0 0;
                display: flex; align-items: center; justify-content: space-between;
                flex-wrap: wrap; gap: 8px;
            }
            .commission-scroll-client {
                font-size: 1.15em; font-weight: bold;
                color: #fff; text-shadow: 1px 1px 3px rgba(0,0,0,0.4);
            }
            .commission-scroll-reward {
                font-size: 1.05em; color: #ffe88a; font-weight: bold;
            }
            .commission-scroll-divider {
                height: 1px; background: rgba(180,150,80,0.3); margin: 0 20px;
            }
            .commission-scroll-req {
                padding: 14px 20px;
                display: flex; justify-content: space-around; flex-wrap: wrap;
                gap: 8px; font-size: 0.9em; color: #ccc;
                background: rgba(0,0,0,0.15);
            }
            .commission-scroll-req span { white-space: nowrap; }
            .commission-scroll-desc {
                padding: 20px 25px; text-align: center;
                line-height: 1.8; color: #ddd; font-size: 0.95em; min-height: 80px;
            }
            .commission-scroll-footer {
                padding: 18px 20px;
                display: flex; gap: 12px;
                background: rgba(0,0,0,0.1); border-radius: 0 0 9px 9px;
            }
            .commission-exec-btn {
                flex: 1; padding: 12px; font-size: 1em;
                background: linear-gradient(90deg, #f5a623, #f5576c);
                border: none; border-radius: 10px;
                color: #fff; cursor: pointer; font-weight: bold;
                font-family: inherit; transition: all 0.2s;
            }
            .commission-exec-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(245,166,35,0.4);
            }
            .commission-exec-btn:disabled {
                background: rgba(255,255,255,0.1); color: #555; cursor: not-allowed;
            }
            .commission-back-btn {
                background: rgba(255,255,255,0.1) !important;
                box-shadow: none !important; transform: none !important;
            }
            .commission-back-btn:hover:not(:disabled) {
                background: rgba(255,255,255,0.18) !important;
                transform: none !important; box-shadow: none !important;
            }
        `;
        document.head.appendChild(style);
    },

    // =====================
    // === 板子（列表）
    // =====================
    open() {
        this._initStyles();

        // 若尚無委託則自動抽籤
        if (!player.currentCommissions || player.currentCommissions.length === 0) {
            this._drawNew();
        }
        if (!player.completedCommissionsThisBoard) {
            player.completedCommissionsThisBoard = [];
        }

        let modal = document.getElementById('commissionModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'commissionModal';
            modal.className = 'modal-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = this._buildBoardHTML();
        modal.classList.add('show');
    },

    close() {
        const modal = document.getElementById('commissionModal');
        if (modal) modal.classList.remove('show');
    },

    // 手動刷新委託（測試 & 旬推進用）
    refresh() {
        this._drawNew();
        player.completedCommissionsThisBoard = [];
        const modal = document.getElementById('commissionModal');
        if (modal) modal.innerHTML = this._buildBoardHTML();
        showToast('📨 委託更新了！');
        DialogueSystem.showDialogue('PC', '新的委託來了！讓我看看有沒有有趣的...');
    },

    _drawNew() {
        if (!CSVLoader.data.commissions || CSVLoader.data.commissions.length === 0) return;
        player.currentCommissions = CommissionCore.drawCommissions(CSVLoader.data.commissions);
    },

    _buildBoardHTML() {
        const completed   = player.completedCommissionsThisBoard || [];
        const ids         = player.currentCommissions || [];
        const commissions = ids
            .map(id => CSVLoader.data.commissions.find(c => c.commission_id === id))
            .filter(Boolean);

        let itemsHtml = '';
        if (commissions.length === 0) {
            itemsHtml = '<div class="commission-empty">委託欄空空如也...</div>';
        } else {
            itemsHtml = commissions.map(c => {
                const isDone = completed.includes(c.commission_id);
                const clickAttr = isDone ? '' : `onclick="CommissionUI.openDetail('${c.commission_id}')"`;
                return `
                    <div class="commission-item ${isDone ? 'done' : ''}" ${clickAttr}>
                        <div class="commission-item-client">📨 ${c.client}</div>
                        <div class="commission-item-reward">
                            💰 ${c.reward}元
                            ${isDone ? '<span class="commission-done-badge">已完成</span>' : ''}
                        </div>
                    </div>`;
            }).join('');
        }

        return `
            <div class="commission-board-modal">
                <div class="modal-title">📨 委託欄</div>
                <div class="commission-list">${itemsHtml}</div>
                <div class="modal-actions">
                    <button class="modal-btn" onclick="CommissionUI.refresh()">🔄 刷新委託</button>
                    <button class="modal-btn primary" onclick="CommissionUI.close()">關閉</button>
                </div>
            </div>`;
    },

    // =====================
    // === 委託詳細
    // =====================
    openDetail(commissionId) {
        const commission = CSVLoader.data.commissions.find(c => c.commission_id === commissionId);
        if (!commission) return;

        const mat      = CommissionCore.getMaterialDisplay(commission);
        const epCost   = parseInt(commission.commission_ep) || 0;
        const canDo    = CommissionCore.canExecute(commission, player);
        const isDone   = (player.completedCommissionsThisBoard || []).includes(commissionId);

        // 隱藏板子，顯示詳細
        const boardModal = document.getElementById('commissionModal');
        if (boardModal) boardModal.classList.remove('show');

        let detailModal = document.getElementById('commissionDetailModal');
        if (!detailModal) {
            detailModal = document.createElement('div');
            detailModal.id = 'commissionDetailModal';
            detailModal.className = 'modal-overlay';
            document.body.appendChild(detailModal);
        }

        // 執行按鈕：已完成 → 顯示灰色「已完成」，材料/EP不足 → disabled
        let execBtnText = '執行';
        let execBtnDisabled = false;
        if (isDone) {
            execBtnText    = '已完成';
            execBtnDisabled = true;
        } else if (!canDo) {
            execBtnDisabled = true;
        }
        const execClick = execBtnDisabled ? '' : `onclick="CommissionUI.execute('${commissionId}')"`;

        detailModal.innerHTML = `
            <div class="commission-scroll">
                <div class="commission-scroll-header">
                    <div class="commission-scroll-client">📨 ${commission.client}</div>
                    <div class="commission-scroll-reward">💰 ${commission.reward}元</div>
                </div>
                <div class="commission-scroll-divider"></div>
                <div class="commission-scroll-req">
                    <span>⚡ ${epCost}</span>
                    <span>⚙️ ${mat.metalName}×${mat.metalDemand}</span>
                    <span>🥖 ${mat.woodName}×${mat.woodDemand}</span>
                </div>
                <div class="commission-scroll-divider"></div>
                <div class="commission-scroll-desc">${commission.description}</div>
                <div class="commission-scroll-divider"></div>
                <div class="commission-scroll-footer">
                    <button class="commission-exec-btn"
                        ${execBtnDisabled ? 'disabled' : ''} ${execClick}>
                        ${execBtnText}
                    </button>
                    <button class="commission-exec-btn commission-back-btn"
                        onclick="CommissionUI.closeDetail()">返回</button>
                </div>
            </div>`;

        detailModal.classList.add('show');
    },

    closeDetail() {
        const modal = document.getElementById('commissionDetailModal');
        if (modal) modal.classList.remove('show');
        this.open();
    },

    // =====================
    // === 執行委託
    // =====================
    execute(commissionId) {
        const commission = CSVLoader.data.commissions.find(c => c.commission_id === commissionId);
        if (!commission) return;

        if (!CommissionCore.canExecute(commission, player)) {
            showToast('❌ 材料或元氣不足！');
            return;
        }

        CommissionCore.execute(commission, player);

        if (!player.completedCommissionsThisBoard) player.completedCommissionsThisBoard = [];
        player.completedCommissionsThisBoard.push(commissionId);

        updateStatsDisplay();
        showToast(`📨 完成！敦親睦鄰真好！`);
        DialogueSystem.showDialogue('PC', '完成！敦親睦鄰真好！');

        this.closeDetail();
    }
};

window.CommissionUI = CommissionUI;

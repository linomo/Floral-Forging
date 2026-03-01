/**
 * IntroSystem - 新遊戲開場劇情系統
 * js/core/intro.js
 *
 * 劇本 JSON 格式：
 * [
 *   { "chara": "SF", "text": "...", "scene": "black", "highlight": "obj_id", "transition": "forge" }
 * ]
 * 所有欄位除 chara/text 外均可省略。
 */
const IntroSystem = {

    _lines:    [],
    _index:    0,
    _overlay:  null,
    _playing:  false,

    // ================================
    // 入口：新遊戲時呼叫
    // ================================
    async start() {
        this._playing = true;
        this._index   = 0;

        // 建立黑屏 overlay
        this._initOverlay();
        // 一開始黑屏
        this._setBlack(true);

        // 切換到臥室場景（劇情從臥室開始）
        currentScene = 'bedroom';
        await renderScene();
        updateSceneSwitchButtons();

        // 載入第一段劇本
        const ok = await this._loadScript('data/intro/intro_drama.json');
        if (!ok) { this._end(); return; }

        this._renderLine();
    },

    // ================================
    // 載入劇本 JSON
    // ================================
    async _loadScript(path) {
        try {
            const res = await fetch(`${path}?t=${Date.now()}`);
            if (!res.ok) throw new Error(`找不到劇本: ${path}`);
            this._lines = await res.json();
            this._index = 0;
            return true;
        } catch (e) {
            console.error('❌ 劇本載入失敗:', e);
            return false;
        }
    },

    // ================================
    // 渲染當前行
    // ================================
    _renderLine() {
        if (this._index >= this._lines.length) {
            this._end();
            return;
        }

        const line       = this._lines[this._index];
        const scene      = line.scene      || '';
        const highlight  = line.highlight  || '';
        const transition = line.transition || '';
        const chara      = line.chara      || '';
        const text       = (line.text || '').replace(/\{name\}/g, player.name);

        // --- 場景效果 ---
        if (scene === 'black') {
            this._setBlack(true);
        } else if (scene === 'fade') {
            this._fadeIn();
        } else if (scene === '') {
            // 不改變（維持目前狀態）
        }

        // --- 場景切換 ---
        if (transition) {
            this._switchScene(transition);
        }

        // --- 高亮物件 ---
        this._clearHighlights();
        if (highlight) this._highlightItem(highlight);

        // --- 顯示對話 ---
        DialogueSystem.showDialogue(chara || 'PC', text);

        // --- 點擊推進 ---
        this._bindClick();
    },

    // ================================
    // 點擊推進
    // ================================
    _bindClick() {
        const dialogueArea = document.querySelector('.dialogue-area');
        if (!dialogueArea) return;

        // 移除舊 handler 再加新的
        if (dialogueArea._introClickHandler) {
            dialogueArea.removeEventListener('click', dialogueArea._introClickHandler);
        }
        dialogueArea._introClickHandler = () => {
            this._index++;
            this._renderLine();
        };
        dialogueArea.addEventListener('click', dialogueArea._introClickHandler, { once: true });
    },

    // ================================
    // 場景切換（非同步，但不等完成就繼續）
    // ================================
    _switchScene(sceneId) {
        currentScene = sceneId;
        renderScene().then(() => {
            updateSceneSwitchButtons();
            updateDateDisplay();
        });
    },

    // ================================
    // 黑屏 Overlay
    // ================================
   _initOverlay() {
    if (document.getElementById('intro-overlay')) {
        this._overlay = document.getElementById('intro-overlay');
        return;
    }
    const el = document.createElement('div');
    el.id = 'intro-overlay';
    el.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: #000; z-index: 50;
        pointer-events: none;
        opacity: 1; transition: opacity 1.5s ease;
    `;
    // 只蓋 operation-area，不蓋對話框
    const opArea = document.querySelector('.operation-area');
    if (opArea) {
        opArea.style.position = 'relative';
        opArea.appendChild(el);
    } else {
        document.body.appendChild(el);
    }
    this._overlay = el;
},

    _setBlack(on) {
        if (!this._overlay) return;
        this._overlay.style.transition = '';
        this._overlay.style.opacity    = on ? '1' : '0';
        this._overlay.style.display    = 'block';
    },

    _fadeIn() {
        if (!this._overlay) return;
        this._overlay.style.display    = 'block';
        this._overlay.style.transition = 'opacity 1.5s ease';
        this._overlay.style.opacity    = '0';
        setTimeout(() => {
            if (this._overlay) this._overlay.style.display = 'none';
        }, 1600);
    },

    // ================================
    // 物件高亮
    // ================================
    _highlightItem(objId) {
        // 支援 id 或 data-obj-id 兩種選法
        let el = document.getElementById(objId)
               || document.querySelector(`[data-obj-id="${objId}"]`);
        if (el) el.classList.add('intro-highlight');
    },

    _clearHighlights() {
        document.querySelectorAll('.intro-highlight')
            .forEach(el => el.classList.remove('intro-highlight'));
    },

    // ================================
    // 結束
    // ================================
    _end() {
        this._playing = false;

        // 移除點擊 handler
        const dialogueArea = document.querySelector('.dialogue-area');
        if (dialogueArea && dialogueArea._introClickHandler) {
            dialogueArea.removeEventListener('click', dialogueArea._introClickHandler);
            dialogueArea._introClickHandler = null;
        }

        this._clearHighlights();
        this._setBlack(false);
        setTimeout(() => {
            if (this._overlay) this._overlay.style.display = 'none';
        }, 1600);

        // 標記新手教學已完成
        player.introCompleted = true;

        // 回到正常遊戲
        updateDateDisplay();
        DialogueSystem.showDialogue('PC', '是時候展現真正的技術了！');
    }
};

window.IntroSystem = IntroSystem;

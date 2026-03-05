/**
 * IntroSystem - 新遊戲開場劇情系統
 * js/core/intro.js
 *
 * 多段劇本佇列：
 * _scripts = ['intro_drama.json', 'intro_forge.json', 'intro_bedroom.json', ...]
 * 每段結束後自動載入下一段，全部結束才呼叫 _end()
 */
const IntroSystem = {

    _lines:       [],
    _index:       0,
    _overlay:     null,
    _playing:     false,
    _scriptQueue: [],   // 待播劇本佇列

    // ================================
    // 入口：新遊戲時呼叫
    // ================================
    async start() {
        this._playing     = true;
        this._index       = 0;
        this._scriptQueue = [
            'data/intro/intro_drama.json',
            'data/intro/intro_forge.json',
            'data/intro/intro_bedroom.json'
        ];
    
        // 鎖住場景，intro 期間不能點擊
        document.getElementById('room-content').style.pointerEvents = 'none';
    
        currentScene = 'bedroom';
        await renderScene();
        updateSceneSwitchButtons();
    
        this._setBlack(true);
        // 加跳過按鈕
        const skipBtn = document.createElement('button');
        skipBtn.id = 'intro-skip-btn';
        skipBtn.textContent = '跳過序章 »';
        skipBtn.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            padding: 8px 16px;
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 20px; color: #888;
            cursor: pointer; font-size: 0.85em;
            font-family: inherit; z-index: 9999;
            transition: all 0.2s;
        `;
        skipBtn.onmouseover = () => { skipBtn.style.color = '#fff'; skipBtn.style.borderColor = 'rgba(255,255,255,0.4)'; };
        skipBtn.onmouseout  = () => { skipBtn.style.color = '#888'; skipBtn.style.borderColor = 'rgba(255,255,255,0.2)'; };
        skipBtn.onclick = () => this._skip();
        document.body.appendChild(skipBtn);
    
        await this._loadNextScript();
    },


    // ================================
    // 載入佇列中的下一段劇本
    // ================================
    async _loadNextScript() {
        if (this._scriptQueue.length === 0) {
            // 所有劇本都播完了
            this._end();
            return;
        }

        const path = this._scriptQueue.shift();  // 取出第一個
        const ok   = await this._loadScript(path);
        if (!ok) {
            // 載入失敗就跳過這段，繼續下一段
            console.warn(`⚠️ 跳過劇本: ${path}`);
            await this._loadNextScript();
            return;
        }

        this._renderLine();
    },

    // ================================
    // 載入單一劇本 JSON
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
            // 這段結束，載入下一段
            this._loadNextScript();
            return;
        }

        const line       = this._lines[this._index];
        const scene      = line.scene      || '';
        const highlight  = line.highlight  || '';
        const transition = line.transition || '';
        const chara      = line.chara      || '';
        const text       = (line.text || '').replace(/\{name\}/g, player.name);

        if (scene === 'black')     this._setBlack(true);
        else if (scene === 'fade') this._fadeIn();

        if (transition) this._switchScene(transition);

        this._clearHighlights();
        if (highlight) this._highlightItem(highlight);

        DialogueSystem.showDialogue(chara || 'PC', text);

        DialogueSystem.showNextBtn(() => {
            this._index++;
            this._renderLine();
        });
    },

    // ================================
    // 場景切換
    // ================================
    _switchScene(sceneId) {
        currentScene = sceneId;
        renderScene().then(() => {
            updateSceneSwitchButtons();
            updateDateDisplay();
        });
    },

    // ================================
    // 黑屏 Overlay（只蓋場景區）
    // ================================
    _initOverlay() {
        const existing = document.getElementById('intro-overlay');
        if (existing) { this._overlay = existing; return; }

        const el = document.createElement('div');
        el.id = 'intro-overlay';
        el.style.cssText = `
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            background: #000; z-index: 50;
            pointer-events: none;
            opacity: 1; transition: opacity 1.5s ease;
        `;

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
        this._overlay.style.transition = 'none';
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
    // 高亮
    // ================================
    _highlightItem(objId) {
        const el = document.getElementById(objId)
                || document.querySelector(`[data-obj-id="${objId}"]`);
        if (el) el.classList.add('intro-highlight');
    },

    _clearHighlights() {
        document.querySelectorAll('.intro-highlight')
            .forEach(el => el.classList.remove('intro-highlight'));
    },
    // 跳過序章
    _skip() {
        this._scriptQueue = [];  // 清空佇列
        this._lines = [];        // 清空當前劇本
        this._end();
    },
    // ================================
    // 全部結束
    // ================================
    _end() {
        this._playing = false;
        DialogueSystem.hideNextBtn();
        this._clearHighlights();
        this._fadeIn();
    
        // 解鎖場景
        document.getElementById('room-content').style.pointerEvents = '';
        // 移除跳過按鈕
        const skipBtn = document.getElementById('intro-skip-btn');
        if (skipBtn) skipBtn.remove();
        player.introCompleted = true;
        updateDateDisplay();
        DialogueSystem.showDialogue('PC', '是時候展現真正的技術了！');
    }
};

window.IntroSystem = IntroSystem;

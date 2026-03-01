/**
 * IntroSystem - 新遊戲開場劇情系統
 * js/core/intro.js
 */
const IntroSystem = {

    _lines:   [],
    _index:   0,
    _overlay: null,
    _playing: false,

    async start() {
        this._playing = true;
        this._index   = 0;

        currentScene = 'bedroom';
        await renderScene();
        updateSceneSwitchButtons();

        this._setBlack(true);

        const ok = await this._loadScript('data/intro/intro_drama.json');
        if (!ok) { this._end(); return; }

        this._renderLine();
    },

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

        if (scene === 'black')     this._setBlack(true);
        else if (scene === 'fade') this._fadeIn();

        if (transition) this._switchScene(transition);

        this._clearHighlights();
        if (highlight) this._highlightItem(highlight);

        DialogueSystem.showDialogue(chara || 'PC', text);

        // 用 DialogueSystem 的按鈕推進
        DialogueSystem.showNextBtn(() => {
            this._index++;
            this._renderLine();
        });
    },

    _switchScene(sceneId) {
        currentScene = sceneId;
        renderScene().then(() => {
            updateSceneSwitchButtons();
            updateDateDisplay();
        });
    },

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

    _highlightItem(objId) {
        const el = document.getElementById(objId)
                || document.querySelector(`[data-obj-id="${objId}"]`);
        if (el) el.classList.add('intro-highlight');
    },

    _clearHighlights() {
        document.querySelectorAll('.intro-highlight')
            .forEach(el => el.classList.remove('intro-highlight'));
    },

    _end() {
        this._playing = false;
        DialogueSystem.hideNextBtn();
        this._clearHighlights();
        this._fadeIn();
        player.introCompleted = true;
        updateDateDisplay();
        DialogueSystem.showDialogue('PC', '是時候展現真正的技術了！');
    }
};

window.IntroSystem = IntroSystem;

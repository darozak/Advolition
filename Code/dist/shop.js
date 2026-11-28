"use strict";
/**
 * The shop: the staging area where players load up to four robots (from card
 * images or script files), review and edit their code, save them as new cards,
 * and then start a battle in the arena.
 */
var Shop;
(function (Shop) {
    Shop.SLOT_COUNT = 4;
    const STORAGE_KEY = 'advolition-shop-v1';
    const OLD_STORAGE_KEY = 'advolition-pit-v1'; // from when the shop was called the pit
    let slots = [];
    // A minimal robot to start from.
    const TEMPLATE = `// MyRobot: a new robot. It already works: it explores, picks up items,
// brings them home and fires back when shot. Change it to make it your own.
//
// @description Describe what your robot does. This text appears on its card.
// @designer Your name
// @version 0.1
//
// See the README ("How to play") for the actions and data your robot can use.

class MyRobot extends Program {
    constructor() {
        super();
        this.turns = 0;
        this.skip = new Set();   // "x,y" tiles to stop heading for (no route, or a Take failed)
    }

    run(myData) {
        const me = myData.robots[myData.myID];
        const here = new Vector(me.pos.x, me.pos.y);
        const home = new Vector(me.nest.x, me.nest.y);
        const atHome = here.isEqualTo(home);
        this.turns++;

        // If the last Take failed (for example, the nest is locked), stop trying there.
        const last = me.lastAction;
        if (last && last.command === 'take' && last.status === 'failed') this.skip.add(here.x + ',' + here.y);

        // 1. Equip the starting gear.
        for (const name of ['Scanner', 'Armor', 'Blaster']) {
            const item = me.items.find(i => i.name === name);
            if (item && !item.isEquipped) return new Equip(name);
        }

        // 2. Fire back for a while after being hit. lastHit.from is null when
        //    the shooter was beyond scan range (lastHit.direction still says
        //    roughly which way the shot came from).
        const hit = me.lastHit;
        if (hit && hit.from && hit.time - myData.gameTime < 30) {
            return new Attack(new Vector(hit.from.x, hit.from.y));
        }

        // 3. Bank loot: at home, drop everything that isn't equipped.
        const loot = me.items.filter(i => !i.isEquipped);
        if (atHome && loot.length > 0) return new Drop(loot[0].name);

        // 4. Pick up a valuable item on this tile.
        const itemHere = myData.itemMap[here.x][here.y].find(i => i.stats.worth > 0);
        if (!atHome && itemHere && !this.skip.has(here.x + ',' + here.y) && me.items.length < me.stats.maxCarry) {
            return new Take(itemHere.name);
        }

        // 5. Look around every few turns.
        if (this.turns % 6 === 1) return new Scan();

        // 6. Carrying loot? Go home. Otherwise go to the nearest valuable item
        //    seen, or explore: the nearest known tile next to an unscanned one.
        let target = null;
        if (loot.length >= 2 || me.items.length >= me.stats.maxCarry) target = home;
        if (!target) target = this.nearest(myData, here, (x, y) =>
            !(x === home.x && y === home.y) && myData.itemMap[x][y].some(i => i.stats.worth > 0));
        if (!target) target = this.nearest(myData, here, (x, y) => this.isFrontier(myData, me, x, y));
        if (!target) target = home;
        if (target.isEqualTo(here)) return new Scan();

        let route = findPath(myData, target);
        if (route.length === 0) route = findPath(myData, target, true);   // try through unscanned tiles
        if (route.length === 0) { this.skip.add(target.x + ',' + target.y); return new Scan(); }
        return new Move(route[0]);
    }

    // The closest tile (in a straight line) that passes a test.
    nearest(myData, from, test) {
        let best = null, bestDistance = Infinity;
        for (let x = 0; x < myData.mapSize.x; x++) {
            for (let y = 0; y < myData.mapSize.y; y++) {
                if (this.skip.has(x + ',' + y) || !test(x, y)) continue;
                const distance = from.getDistanceTo(new Vector(x, y));
                if (distance < bestDistance) { best = new Vector(x, y); bestDistance = distance; }
            }
        }
        return best;
    }

    // A tile we can walk on with an unscanned tile next to it.
    isFrontier(myData, me, x, y) {
        const tile = myData.tileMap[x][y];
        if (tile < 0 || !me.stats.permissiveTerrain.includes(myData.tiles[tile].name)) return false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < myData.mapSize.x && ny < myData.mapSize.y && myData.tileMap[nx][ny] < 0) return true;
            }
        }
        return false;
    }
}

new MyRobot();
`;
    // ------------------------------------------------------------------------
    // Saving slots between visits (in this browser only).
    // ------------------------------------------------------------------------
    function save() {
        const message = document.getElementById('shop-message');
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
            if (message && message.dataset.storage) {
                message.textContent = '';
                delete message.dataset.storage;
            }
        }
        catch (e) {
            // Out of room (or storage is off). Remove the old copy so a reload
            // doesn't bring back robots from before, and say so.
            try {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(OLD_STORAGE_KEY);
            }
            catch (e2) { /* storage unavailable */ }
            if (message) {
                message.textContent = "Your robots are too big to remember in this browser, so they won't be here after a reload. Save them as cards or scripts to keep them.";
                message.dataset.storage = '1';
            }
        }
    }
    function restore() {
        slots = [];
        for (let i = 0; i < Shop.SLOT_COUNT; i++)
            slots.push({ code: null, source: '' });
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY) || '[]');
            if (Array.isArray(saved))
                saved.slice(0, Shop.SLOT_COUNT).forEach((s, i) => {
                    if (s && typeof s.code === 'string')
                        slots[i] = { code: s.code, source: String(s.source || '') };
                });
        }
        catch (e) { /* nothing saved, or storage unavailable */ }
    }
    // ------------------------------------------------------------------------
    // Building the slot panels.
    // ------------------------------------------------------------------------
    const el = (tag, cls, text) => {
        const e = document.createElement(tag);
        if (cls)
            e.className = cls;
        if (text !== undefined)
            e.textContent = text;
        return e;
    };
    const views = [];
    function buildSlot(i) {
        const root = el('div', 'slot');
        const head = el('div', 'slot-head');
        const number = el('span', 'slot-number', `${i + 1}`);
        const name = el('span', 'slot-name');
        const source = el('span', 'slot-source');
        head.append(number, name, source);
        const body = el('div', 'slot-body');
        const cardBox = el('div', 'slot-card-box');
        // The card image shows both sides; the slot shows one at a time, and
        // clicking turns the card over.
        const cardView = el('button', 'card-view');
        cardView.type = 'button';
        cardView.title = 'Turn the card over';
        cardView.setAttribute('aria-label', `Turn over the card in slot ${i + 1}`);
        const card = el('canvas', 'slot-card');
        cardView.append(card);
        cardView.onclick = () => cardView.classList.toggle('back');
        const placeholder = el('div', 'slot-placeholder', 'Drop a card image or a .js script here, or use Load.');
        cardBox.append(cardView, placeholder);
        const side = el('div', 'slot-side');
        const status = el('div', 'slot-status');
        const actions = el('div', 'slot-actions');
        const fileLabel = el('label', 'button', 'Load card or script');
        const file = el('input');
        file.type = 'file';
        file.accept = 'image/*,.js,.txt,text/javascript,text/plain';
        file.className = 'visually-hidden'; // still reachable with Tab, unlike `hidden`
        fileLabel.append(file);
        const newButton = el('button', '', 'New robot');
        const reviewButton = el('button', '', 'Review code');
        const saveCard = el('button', '', 'Save as card');
        const saveScript = el('button', '', 'Save script');
        const clear = el('button', 'danger', 'Clear');
        actions.append(fileLabel, newButton, reviewButton, saveCard, saveScript, clear);
        side.append(status, actions);
        body.append(cardBox, side);
        const review = el('div', 'slot-review');
        review.hidden = true;
        const editor = el('textarea', 'slot-editor');
        editor.spellcheck = false;
        editor.setAttribute('aria-label', `Code for slot ${i + 1}`);
        const reviewBar = el('div', 'slot-review-bar');
        const apply = el('button', 'primary', 'Apply changes');
        const hint = el('span', 'hint', 'Read the code before it fights. Edits apply to this slot; save it as a new card to share them. Tab indents; press Esc, then Tab, to leave the editor.');
        reviewBar.append(apply, hint);
        review.append(CodeEditor.attach(editor), reviewBar);
        root.append(head, body, review);
        // Loading
        file.onchange = () => { if (file.files && file.files[0])
            loadFile(i, file.files[0]); file.value = ''; };
        // Only file drags are handled here, so text can still be dragged within the editor.
        const hasFiles = (e) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
        root.addEventListener('dragover', (e) => { if (!hasFiles(e))
            return; e.preventDefault(); root.classList.add('drop'); });
        root.addEventListener('dragleave', () => root.classList.remove('drop'));
        root.addEventListener('drop', (e) => {
            root.classList.remove('drop');
            if (!hasFiles(e))
                return;
            e.preventDefault();
            const f = e.dataTransfer && e.dataTransfer.files[0];
            if (f)
                loadFile(i, f);
        });
        newButton.onclick = () => {
            if (slots[i].code && !confirm('Replace the robot in this slot with a new, blank robot?'))
                return;
            setSlot(i, TEMPLATE, 'New robot', 'A new robot from the template. Edit its code below.');
            openReview(i, true);
        };
        // Reviewing and editing
        reviewButton.onclick = () => openReview(i, review.hidden);
        apply.onclick = () => applyEdits(i);
        // Saving
        saveCard.onclick = () => saveAsCard(i);
        saveScript.onclick = () => {
            const code = slots[i].code;
            if (!code)
                return;
            download(new Blob([code], { type: 'text/javascript' }), `${fileName(code)}.js`);
        };
        clear.onclick = () => { if (confirm('Remove this robot from the shop?'))
            clearSlot(i); };
        return { root, name, source, status, card, placeholder, review, editor, reviewButton, saveCard, saveScript, clear, shown: '' };
    }
    function applyEdits(i) {
        const code = views[i].editor.value;
        if (!code.trim()) {
            clearSlot(i);
            return;
        }
        setSlot(i, code, slots[i].source.replace(/ \(edited\)$/, '') + ' (edited)', 'Changes applied.');
        checkSyntax(i, true);
    }
    // Warns about a syntax error in a slot's code, with its line, and (when
    // asked) selects that line in the editor. The code is kept either way.
    async function checkSyntax(i, showLine) {
        const change = changes[i], code = slots[i].code;
        if (!code)
            return;
        const error = await SandboxedBot.findSyntaxError(code);
        if (!error || changes[i] !== change)
            return;
        setStatus(i, `Line ${error.line}: ${error.message}. This robot can't battle until that's fixed.`, 'error');
        if (showLine && !views[i].review.hidden)
            CodeEditor.goToLine(views[i].editor, error.line);
    }
    /**
     * Applies any code edits that haven't been applied yet, so a battle never
     * runs older code than the shop shows. Returns the slot numbers changed.
     */
    function applyPendingEdits() {
        const changed = [];
        views.forEach((v, i) => {
            if (slots[i].code && v.editor.value !== v.shown) {
                applyEdits(i);
                changed.push(i + 1);
            }
        });
        return changed;
    }
    Shop.applyPendingEdits = applyPendingEdits;
    function openReview(i, open) {
        const v = views[i];
        v.review.hidden = !open || !slots[i].code;
        v.reviewButton.textContent = v.review.hidden ? 'Review code' : 'Hide code';
        if (!v.review.hidden)
            showCode(v, slots[i].code || '', false); // keeps unapplied edits
    }
    // Puts code in a slot's editor. Unless `replace` is set, edits that haven't
    // been applied are kept.
    function showCode(v, code, replace) {
        if (!replace && v.editor.value !== v.shown)
            return;
        v.shown = code;
        if (v.editor.value === code)
            return; // keeps the reader's place after "Apply changes"
        v.editor.value = code;
        CodeEditor.refresh(v.editor);
    }
    function setStatus(i, text, kind = '') {
        const s = views[i].status;
        s.textContent = text;
        s.className = 'slot-status' + (kind ? ' ' + kind : '');
    }
    // Redraws a slot from its code.
    async function render(i) {
        const v = views[i], slot = slots[i];
        const filled = !!slot.code;
        v.root.classList.toggle('empty', !filled);
        v.reviewButton.disabled = v.saveCard.disabled = v.saveScript.disabled = v.clear.disabled = !filled;
        if (!slot.code) {
            v.name.textContent = 'Empty slot';
            v.source.textContent = '';
            v.card.parentElement.hidden = true;
            v.placeholder.hidden = false;
            v.placeholder.textContent = 'Drop a card image or a .js script here, or use Load.';
            v.review.hidden = true;
            v.reviewButton.textContent = 'Review code';
            v.root.style.removeProperty('--slot-hue');
            return;
        }
        const info = Cards.describe(slot.code);
        v.name.textContent = info.name;
        v.source.textContent = slot.source;
        v.root.style.setProperty('--slot-hue', `${Cards.hueOf(slot.code)}`);
        showCode(v, slot.code, true); // new code replaces the editor's
        try {
            await Cards.draw(v.card, slot.code);
            v.card.parentElement.hidden = false;
            v.placeholder.hidden = true;
            v.saveCard.disabled = false;
        }
        catch (e) {
            // Too big for a card: it can still battle, it just can't be saved as one.
            v.card.parentElement.hidden = true;
            v.placeholder.hidden = false;
            v.placeholder.textContent = e instanceof Error ? e.message : String(e);
            v.saveCard.disabled = true;
        }
    }
    // Counts changes to each slot, so a file that finishes loading after the
    // slot has changed again (another file, Clear, Apply) is ignored.
    const changes = [];
    function setSlot(i, code, source, message, kind = 'ok') {
        changes[i] = (changes[i] || 0) + 1;
        // A lone half of a surrogate pair can't be stored on a card (it becomes
        // U+FFFD), so replace it here, keeping the slot and its card the same.
        if (typeof code.toWellFormed === 'function')
            code = code.toWellFormed();
        slots[i] = { code, source };
        save();
        setStatus(i, message, kind);
        render(i);
        updateBattleButton();
    }
    function clearSlot(i) {
        changes[i] = (changes[i] || 0) + 1;
        slots[i] = { code: null, source: '' };
        save();
        setStatus(i, '');
        render(i);
        updateBattleButton();
    }
    // ------------------------------------------------------------------------
    // Loading cards and scripts.
    // ------------------------------------------------------------------------
    async function loadFile(i, file) {
        const change = changes[i] = (changes[i] || 0) + 1;
        const stale = () => changes[i] !== change;
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
            setStatus(i, `Reading ${file.name}…`);
            let image;
            try {
                image = await createImageBitmap(file);
            }
            catch (e) {
                if (!stale())
                    setStatus(i, `${file.name} couldn't be opened as an image.`, 'error');
                return;
            }
            const result = await Cards.read(image);
            if (stale())
                return;
            if (!result.ok) {
                setStatus(i, `${file.name}: ${result.reason}`, 'error');
                return;
            }
            const repaired = result.fixed ? ` ${result.fixed} damaged bytes were repaired.` : '';
            setSlot(i, result.code, `Card: ${file.name}`, `Code read from the card.${repaired} Review it below before battling.`);
            openReview(i, true);
        }
        else {
            const text = await file.text();
            if (stale())
                return;
            if (!/extends\s+Program/.test(text)) {
                setStatus(i, `${file.name} doesn't look like a robot script: it should define a class that extends Program.`, 'error');
                return;
            }
            setSlot(i, text, `Script: ${file.name}`, 'Script loaded.');
            checkSyntax(i, false);
        }
    }
    /** Loads the sample robots into empty slots (needs the game to be served from a website). */
    async function loadSamples() {
        const samples = ['Samples/gatherer.js', 'Samples/sentinel.js'];
        const empty = slots.map((s, i) => s.code ? -1 : i).filter(i => i >= 0);
        const message = document.getElementById('shop-message');
        if (empty.length === 0) {
            if (message)
                message.textContent = 'All four slots are full. Clear one to add a sample robot.';
            return;
        }
        let loaded = 0;
        for (const path of samples) {
            if (loaded >= empty.length)
                break;
            try {
                const response = await fetch(path);
                if (!response.ok)
                    throw new Error(response.statusText);
                const i = empty[loaded++];
                setSlot(i, await response.text(), `Sample: ${path.split('/').pop()}`, 'Sample robot loaded.');
            }
            catch (e) {
                if (message)
                    message.textContent = "The sample robots couldn't be loaded here. They load on the live site, or you can download the sample cards from the home page and load those.";
                return;
            }
        }
        if (message)
            message.textContent = '';
    }
    Shop.loadSamples = loadSamples;
    // ------------------------------------------------------------------------
    // Saving cards.
    // ------------------------------------------------------------------------
    function fileName(code) {
        const info = Cards.describe(code);
        const version = info.fields.version ? '-v' + info.fields.version.replace(/[^\w.]+/g, '') : '';
        return (info.name + version).replace(/[^\p{L}\p{N}_.-]+/gu, '-');
    }
    function download(blob, name) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    }
    async function saveAsCard(i) {
        const code = slots[i].code;
        if (!code)
            return;
        const canvas = document.createElement('canvas');
        try {
            await Cards.draw(canvas, code);
        }
        catch (e) {
            setStatus(i, e instanceof Error ? e.message : String(e), 'error');
            return;
        }
        canvas.toBlob(blob => {
            if (!blob)
                return;
            download(blob, `${fileName(code)}.png`);
            setStatus(i, 'Card saved. Share the PNG file itself: social media sites that shrink or heavily re-compress images can damage the code strip.', 'ok');
        }, 'image/png');
    }
    // ------------------------------------------------------------------------
    // Starting a battle.
    // ------------------------------------------------------------------------
    /** The loaded robots, with names made unique ("Gatherer", "Gatherer 2"). */
    function robots() {
        const used = {};
        return slots.filter(s => s.code).map(s => {
            const base = Cards.describe(s.code).name;
            used[base] = (used[base] || 0) + 1;
            return { name: used[base] > 1 ? `${base} ${used[base]}` : base, code: s.code };
        });
    }
    Shop.robots = robots;
    function updateBattleButton() {
        const count = slots.filter(s => s.code).length;
        const button = document.getElementById('shop-battle');
        if (button) {
            button.disabled = count === 0;
            button.textContent = count ? `Start battle with ${count} robot${count > 1 ? 's' : ''}` : 'Start battle';
        }
    }
    function init() {
        restore();
        const container = document.getElementById('slots');
        if (!container)
            return;
        for (let i = 0; i < Shop.SLOT_COUNT; i++) {
            const v = buildSlot(i);
            views.push(v);
            container.append(v.root);
            render(i);
        }
        updateBattleButton();
    }
    Shop.init = init;
})(Shop || (Shop = {}));

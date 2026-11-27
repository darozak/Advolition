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
    const TEMPLATE = `// MyRobot: a new robot.
//
// @description Describe what your robot does. This text appears on its card.
// @designer Your name
// @version 0.1
//
// See the README ("How to play") for the actions and data your robot can use.

class MyRobot extends Program {
    run(myData) {
        const me = myData.robots[myData.myID];

        // Equip the starting gear first.
        for (const name of ['Scanner', 'Armor', 'Blaster']) {
            const item = me.items.find(i => i.name === name);
            if (item && !item.isEquipped) return new Equip(name);
        }

        // Then look around.
        return new Scan();
    }
}

new MyRobot();
`;
    // ------------------------------------------------------------------------
    // Saving slots between visits (in this browser only).
    // ------------------------------------------------------------------------
    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
        }
        catch (e) { /* storage unavailable: slots just aren't remembered */ }
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
        const card = el('canvas', 'slot-card');
        const placeholder = el('div', 'slot-placeholder', 'Drop a card image or a .js script here, or use Load.');
        cardBox.append(card, placeholder);
        const side = el('div', 'slot-side');
        const status = el('div', 'slot-status');
        const actions = el('div', 'slot-actions');
        const fileLabel = el('label', 'button', 'Load card or script');
        const file = el('input');
        file.type = 'file';
        file.accept = 'image/*,.js,.txt,text/javascript,text/plain';
        file.hidden = true;
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
        root.addEventListener('dragover', (e) => { e.preventDefault(); root.classList.add('drop'); });
        root.addEventListener('dragleave', () => root.classList.remove('drop'));
        root.addEventListener('drop', (e) => {
            e.preventDefault();
            root.classList.remove('drop');
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
        apply.onclick = () => {
            const code = editor.value;
            if (!code.trim()) {
                clearSlot(i);
                return;
            }
            setSlot(i, code, slots[i].source.replace(/ \(edited\)$/, '') + ' (edited)', 'Changes applied.');
        };
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
        return { root, name, source, status, card, placeholder, review, editor, reviewButton, saveCard, saveScript, clear };
    }
    function openReview(i, open) {
        const v = views[i];
        v.review.hidden = !open || !slots[i].code;
        v.reviewButton.textContent = v.review.hidden ? 'Review code' : 'Hide code';
        if (!v.review.hidden)
            showCode(v, slots[i].code || '');
    }
    function showCode(v, code) {
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
            v.card.hidden = true;
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
        if (!v.review.hidden)
            showCode(v, slot.code);
        try {
            await Cards.draw(v.card, slot.code);
            v.card.hidden = false;
            v.placeholder.hidden = true;
            v.saveCard.disabled = false;
        }
        catch (e) {
            // Too big for a card: it can still battle, it just can't be saved as one.
            v.card.hidden = true;
            v.placeholder.hidden = false;
            v.placeholder.textContent = e instanceof Error ? e.message : String(e);
            v.saveCard.disabled = true;
        }
    }
    function setSlot(i, code, source, message, kind = 'ok') {
        slots[i] = { code, source };
        save();
        setStatus(i, message, kind);
        render(i);
        updateBattleButton();
    }
    function clearSlot(i) {
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
        if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)) {
            setStatus(i, `Reading ${file.name}…`);
            let image;
            try {
                image = await createImageBitmap(file);
            }
            catch (e) {
                setStatus(i, `${file.name} couldn't be opened as an image.`, 'error');
                return;
            }
            const result = await Cards.read(image);
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
            if (!/extends\s+Program/.test(text)) {
                setStatus(i, `${file.name} doesn't look like a robot script: it should define a class that extends Program.`, 'error');
                return;
            }
            setSlot(i, text, `Script: ${file.name}`, 'Script loaded.');
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
        return (info.name + version).replace(/[^\w.-]+/g, '-');
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

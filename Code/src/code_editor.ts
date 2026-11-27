/**
 * A light code editor for robot scripts: line numbers and JavaScript color
 * coding on top of an ordinary textarea.
 *
 * The textarea still does all the editing (typing, selection, undo, copy and
 * paste); its text is transparent. Behind it sits a highlighted copy of the
 * same text, and beside it a gutter of line numbers. Both follow the
 * textarea's scrolling. Lines don't wrap, so each line number always lines up
 * with its line.
 */
namespace CodeEditor {

    const KEYWORDS = new Set([
        'class', 'extends', 'const', 'let', 'var', 'function', 'static', 'get', 'set',
        'async', 'await', 'new', 'delete', 'typeof', 'instanceof', 'in', 'of', 'void', 'yield',
    ]);
    const CONTROL = new Set([
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default', 'break', 'continue',
        'return', 'throw', 'try', 'catch', 'finally',
    ]);
    const LITERALS = new Set(['true', 'false', 'null', 'undefined', 'this', 'super', 'NaN', 'Infinity']);

    // One pass over the code: comments, strings, numbers and words. Anything
    // else (operators, brackets, spaces) is left plain.
    const TOKENS = new RegExp([
        /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))/.source,                                         // 1 comment
        /('(?:\\[\s\S]|[^'\\\n])*'?|"(?:\\[\s\S]|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?)/.source, // 2 string
        /(\b(?:0[xXbBoO][\da-fA-F_]+|\d[\d_]*(?:\.\d*)?(?:[eE][+-]?\d+)?)n?\b|\.\d+\b)/.source, // 3 number
        /([A-Za-z_$][\w$]*)/.source,                                                           // 4 word
        /(\/(?![*\/])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^\/\\\n\[])+\/[dgimsuyv]*)/.source,              // 5 regex (or division)
    ].join('|'), 'g');

    // Words after which a "/" starts a regular expression rather than a division.
    const BEFORE_REGEX = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

    // What came just before the current position, ignoring spaces and comments:
    // the last punctuation mark, or the last word. `blockEnd` says whether a
    // closing brace ended a block of code (rather than an object).
    interface Before { char: string, word: string, blockEnd: boolean }

    // Whether a "/" here begins a regular expression rather than a division. It
    // does unless it follows something that ends a value: a name, number,
    // string, closing bracket, or the brace of an object. (After a block's
    // closing brace a new statement starts, so it is a regular expression.)
    function startsRegex(b: Before): boolean {
        if (b.word) return BEFORE_REGEX.has(b.word) || (CONTROL.has(b.word) && b.word !== 'default');
        if (b.char === '}') return b.blockEnd;
        return !/^[)\]'"0]$/.test(b.char);
    }

    // Whether a "{" here opens a block of code (after `)`, `=>`, `else`, a class
    // name, or at the start of a statement) rather than an object literal.
    function opensBlock(b: Before): boolean {
        if (b.word) return b.word === 'else' || b.word === 'do' || !BEFORE_REGEX.has(b.word);
        return ['', ';', '{', '}', ')', '=>'].includes(b.char);
    }

    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const span = (cls: string, text: string) => `<span class="tok-${cls}">${escape(text)}</span>`;

    /** Returns the code as HTML with each token wrapped in a colored span. */
    export function highlight(code: string): string {
        let html = '', last = 0;
        let before: Before = { char: '', word: '', blockEnd: false };
        const braces: boolean[] = [];   // for each open "{": does it open a block?

        // Notes the punctuation between tokens.
        const punctuation = (text: string) => {
            for (const c of text) {
                if (/\s/.test(c)) continue;
                let blockEnd = false, char = c;
                if (c === '{') braces.push(opensBlock(before));
                else if (c === '}') blockEnd = braces.length ? braces.pop()! : true;
                else if (c === '>' && before.char === '=') char = '=>';
                before = { char, word: '', blockEnd };
            }
        };

        TOKENS.lastIndex = 0;
        for (let m: RegExpExecArray | null; (m = TOKENS.exec(code)); ) {
            const gap = code.slice(last, m.index);
            html += escape(gap);
            punctuation(gap);
            last = TOKENS.lastIndex;
            if (m[1]) {
                // Comments, with the card's @fields picked out. They don't change `before`.
                html += `<span class="tok-comment">${escape(m[1]).replace(/@(description|designer|version)\b/g, '<span class="tok-tag">@$1</span>')}</span>`;
            } else if (m[5]) {
                if (startsRegex(before)) {
                    html += span('regex', m[5]);
                    before = { char: ')', word: '', blockEnd: false };   // a value, like a closing bracket
                } else {
                    // A division sign: leave it plain and read on from the next character.
                    html += '/';
                    before = { char: '/', word: '', blockEnd: false };
                    TOKENS.lastIndex = last = m.index + 1;
                }
            } else if (m[2]) {
                html += span('string', m[2]);
                before = { char: '"', word: '', blockEnd: false };
            } else if (m[3]) {
                html += span('number', m[3]);
                before = { char: '0', word: '', blockEnd: false };
            } else {
                const word = m[4];
                const isProperty = before.char === '.';
                const next = code.slice(last).match(/^\s*(\S)/);
                if (!isProperty && CONTROL.has(word)) html += span('control', word);
                else if (!isProperty && KEYWORDS.has(word)) html += span('keyword', word);
                else if (!isProperty && LITERALS.has(word)) html += span('literal', word);
                else if (next && next[1] === '(') html += span('function', word);
                else if (/^[A-Z]/.test(word) && /[a-z]/.test(word)) html += span('class', word);
                else if (isProperty) html += span('property', word);
                else html += escape(word);
                // A property named like a keyword (obj.return) is just a name.
                before = { char: '', word: isProperty ? '_' : word, blockEnd: false };
            }
        }
        return html + escape(code.slice(last));
    }

    interface Parts { code: HTMLElement, gutter: HTMLElement, lines: number }
    const editors = new WeakMap<HTMLTextAreaElement, Parts>();

    /**
     * Turns a textarea into a code editor. Returns the element to put in the
     * page in place of the textarea (the textarea goes inside it).
     */
    export function attach(textarea: HTMLTextAreaElement): HTMLElement {
        const root = document.createElement('div');
        root.className = 'code-editor';
        const gutter = document.createElement('div');
        gutter.className = 'code-gutter';
        gutter.setAttribute('aria-hidden', 'true');
        const gutterText = document.createElement('pre');
        gutter.append(gutterText);
        const area = document.createElement('div');
        area.className = 'code-area';
        const pre = document.createElement('pre');
        pre.className = 'code-highlight';
        pre.setAttribute('aria-hidden', 'true');
        const code = document.createElement('code');
        pre.append(code);
        textarea.classList.add('code-input');
        textarea.wrap = 'off';
        textarea.spellcheck = false;
        textarea.autocapitalize = 'off';
        textarea.setAttribute('autocomplete', 'off');
        textarea.setAttribute('autocorrect', 'off');
        area.append(pre, textarea);
        root.append(gutter, area);

        editors.set(textarea, { code, gutter: gutterText, lines: 0 });
        textarea.addEventListener('input', () => refresh(textarea));
        textarea.addEventListener('scroll', () => syncScroll(textarea));
        textarea.addEventListener('keydown', (e) => handleKey(textarea, e));
        textarea.addEventListener('blur', () => escaped.delete(textarea));
        refresh(textarea);
        return root;
    }

    // ------------------------------------------------------------------------
    // Tab indents. Tab inserts spaces up to the next tab stop, or indents every
    // selected line; Shift+Tab outdents. Press Escape first to let Tab move to
    // the next control as usual, so keyboard users are never stuck in the editor.
    // ------------------------------------------------------------------------
    const INDENT = 4;
    const escaped = new WeakSet<HTMLTextAreaElement>();

    function handleKey(textarea: HTMLTextAreaElement, e: KeyboardEvent) {
        if (e.key === 'Escape') { escaped.add(textarea); return; }
        if (e.key !== 'Tab' || e.ctrlKey || e.altKey || e.metaKey) { escaped.delete(textarea); return; }
        if (escaped.has(textarea)) { escaped.delete(textarea); return; }   // let Tab leave the editor
        e.preventDefault();

        const text = textarea.value;
        const start = textarea.selectionStart, end = textarea.selectionEnd;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const multiLine = text.slice(start, end).includes('\n');

        if (!e.shiftKey && !multiLine) {
            // Spaces up to the next tab stop.
            const column = start - lineStart;
            replace(textarea, start, end, ' '.repeat(INDENT - (column % INDENT)));
            return;
        }

        // Indent or outdent every line the selection touches. (A selection that
        // ends at the very start of a line doesn't include that line.)
        const lastLineEnd = end > start && text[end - 1] === '\n' ? end - 1 : end;
        let blockEnd = text.indexOf('\n', lastLineEnd);
        if (blockEnd < 0) blockEnd = text.length;
        const lines = text.slice(lineStart, blockEnd).split('\n');
        let firstChange = 0, totalChange = 0;
        const changed = lines.map((line, n) => {
            let delta: number;
            if (e.shiftKey) {
                delta = -Math.min(line.match(/^ */)![0].length, INDENT);
                line = line.slice(-delta);
            } else {
                delta = line.length ? INDENT : 0;   // leave blank lines blank
                line = ' '.repeat(delta) + line;
            }
            if (n === 0) firstChange = delta;
            totalChange += delta;
            return line;
        });
        const block = changed.join('\n');
        if (block === text.slice(lineStart, blockEnd)) return;
        replace(textarea, lineStart, blockEnd, block);
        if (multiLine) {
            textarea.setSelectionRange(lineStart, lineStart + block.length);   // keep the lines selected for another Tab
        } else {
            const caret = Math.max(lineStart, start + firstChange);
            textarea.setSelectionRange(caret, Math.max(lineStart, end + totalChange));
        }
    }

    // Replaces text in a way that the browser's undo can take back.
    function replace(textarea: HTMLTextAreaElement, from: number, to: number, text: string) {
        textarea.setSelectionRange(from, to);
        if (!document.execCommand('insertText', false, text)) {
            textarea.setRangeText(text, from, to, 'end');
            textarea.dispatchEvent(new Event('input'));
        }
    }

    /** Redraws the colors and line numbers. Call after setting the value in code. */
    export function refresh(textarea: HTMLTextAreaElement) {
        const parts = editors.get(textarea);
        if (!parts) return;
        // A trailing space keeps a final empty line its full height.
        parts.code.innerHTML = highlight(textarea.value) + ' ';
        const lines = textarea.value.split('\n').length;
        if (lines !== parts.lines) {
            parts.lines = lines;
            let numbers = '';
            for (let n = 1; n <= lines; n++) numbers += n + '\n';
            parts.gutter.textContent = numbers;
        }
        syncScroll(textarea);
    }

    function syncScroll(textarea: HTMLTextAreaElement) {
        const parts = editors.get(textarea);
        if (!parts) return;
        const pre = parts.code.parentElement as HTMLElement;
        pre.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
        parts.gutter.style.transform = `translateY(${-textarea.scrollTop}px)`;
    }
}

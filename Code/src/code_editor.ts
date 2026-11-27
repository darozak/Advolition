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
    ].join('|'), 'g');

    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const span = (cls: string, text: string) => `<span class="tok-${cls}">${escape(text)}</span>`;

    /** Returns the code as HTML with each token wrapped in a colored span. */
    export function highlight(code: string): string {
        let html = '', last = 0;
        TOKENS.lastIndex = 0;
        for (let m: RegExpExecArray | null; (m = TOKENS.exec(code)); ) {
            html += escape(code.slice(last, m.index));
            last = TOKENS.lastIndex;
            if (m[1]) {
                // Comments, with the card's @fields picked out.
                html += `<span class="tok-comment">${escape(m[1]).replace(/@(description|designer|version)\b/g, '<span class="tok-tag">@$1</span>')}</span>`;
            } else if (m[2]) html += span('string', m[2]);
            else if (m[3]) html += span('number', m[3]);
            else {
                const word = m[4];
                const before = code.slice(0, m.index).match(/(\S)\s*$/);
                const isProperty = !!before && before[1] === '.';
                const next = code.slice(last).match(/^\s*(\S)/);
                if (!isProperty && CONTROL.has(word)) html += span('control', word);
                else if (!isProperty && KEYWORDS.has(word)) html += span('keyword', word);
                else if (!isProperty && LITERALS.has(word)) html += span('literal', word);
                else if (next && next[1] === '(') html += span('function', word);
                else if (/^[A-Z]/.test(word) && /[a-z]/.test(word)) html += span('class', word);
                else if (isProperty) html += span('property', word);
                else html += escape(word);
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
        refresh(textarea);
        return root;
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

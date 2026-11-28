/**
 * The "How to play" page. It shows the README, so the rules on the site are
 * always the same as in the repository. The README is fetched and turned into
 * HTML by a small Markdown renderer that handles what the README uses:
 * headings, paragraphs, lists (with indented tables and lists inside them),
 * tables, code blocks (JavaScript is coloured like the code editor), inline
 * code, bold, italic and links.
 */
namespace Help {

    const README_URL = 'README.md';
    const GITHUB_README = 'https://github.com/darozak/Advolition#readme';
    let loaded = false;

    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const slug = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');

    // Inline Markdown: code spans, links, bold, italic. Text is escaped first,
    // and code spans are set aside so nothing inside them is treated as Markdown.
    function inline(text: string): string {
        const codes: string[] = [];
        text = text.replace(/`([^`]+)`/g, (_, code) => { codes.push(code); return `\u0000${codes.length - 1}\u0000`; });
        let html = escape(text);
        html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
            const external = /^https?:/.test(url);
            return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
        });
        html = html.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, pre, url) => `${pre}<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
        html = html.replace(/(^|[\s(])_([^_\s][^_]*)_(?=[\s.,;:)]|$)/g, '$1<em>$2</em>');
        return html.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escape(codes[+i])}</code>`);
    }

    const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    const isTableStart = (lines: string[], i: number) =>
        /^\s*\|/.test(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1]);
    const listItem = /^(\s*)([-*]|\d+\.)\s+(.*)$/;

    /** Renders Markdown blocks to HTML. */
    export function render(markdown: string): string {
        const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
        let html = '';
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];

            // Blank line
            if (!line.trim()) { i++; continue; }

            // Code block
            const fence = line.match(/^\s*```(\w*)/);
            if (fence) {
                const code: string[] = [];
                for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
                i++;
                const text = code.join('\n');
                const body = /^(js|javascript)$/i.test(fence[1]) ? CodeEditor.highlight(text) : escape(text);
                html += `<pre class="help-code"><code>${body}</code></pre>`;
                continue;
            }

            // Heading
            const heading = line.match(/^(#{1,6})\s+(.*)$/);
            if (heading) {
                const level = Math.min(heading[1].length, 4), text = inline(heading[2]);
                html += `<h${level} id="help-${slug(text)}">${text}</h${level}>`;
                i++;
                continue;
            }

            // Table
            if (isTableStart(lines, i)) {
                const head = cells(lines[i]);
                i += 2;
                let rows = '';
                for (; i < lines.length && /^\s*\|/.test(lines[i]); i++) rows += `<tr>${cells(lines[i]).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`;
                html += `<div class="help-table"><table><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
                continue;
            }

            // List: each item takes the lines indented under it, which are
            // rendered as blocks of their own (a nested list or table).
            const first = line.match(listItem);
            if (first) {
                const indent = first[1].length, ordered = /\d/.test(first[2]);
                let items = '';
                while (i < lines.length) {
                    const m = lines[i].match(listItem);
                    if (!m || m[1].length !== indent) break;
                    const body: string[] = [m[3]];
                    for (i++; i < lines.length; i++) {
                        const next = lines[i];
                        if (!next.trim()) {
                            // A blank line ends the item unless more indented lines follow.
                            if (i + 1 < lines.length && lines[i + 1].search(/\S/) > indent) { body.push(''); continue; }
                            break;
                        }
                        if (next.search(/\S/) <= indent) break;
                        body.push(next.slice(Math.min(next.search(/\S/), indent + 2)));
                    }
                    // The first lines (up to a nested block) are the item's text.
                    let k = 1;
                    while (k < body.length && body[k].trim() && !listItem.test(body[k]) && !/^\s*\|/.test(body[k])) k++;
                    const text = inline(body.slice(0, k).join(' '));
                    const rest = body.slice(k).join('\n');
                    items += `<li>${text}${rest.trim() ? render(rest) : ''}</li>`;
                    while (i < lines.length && !lines[i].trim() && i + 1 < lines.length && (lines[i + 1].match(listItem) || [])[1] === first[1]) i++;
                }
                html += ordered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
                continue;
            }

            // Paragraph: consecutive lines that don't start another block.
            const para: string[] = [];
            for (; i < lines.length && lines[i].trim() && !/^\s*(```|#{1,6}\s)/.test(lines[i]) && !lines[i].match(listItem) && !isTableStart(lines, i); i++) para.push(lines[i].trim());
            html += `<p>${inline(para.join(' '))}</p>`;
        }
        return html;
    }

    /** Fills the How to play page from the README, the first time it's shown. */
    export async function load() {
        if (loaded) return;
        const content = document.getElementById('help-content');
        const toc = document.getElementById('help-toc');
        if (!content || !toc) return;
        try {
            const response = await fetch(README_URL, { cache: 'no-cache' });
            if (!response.ok) throw new Error(response.statusText);
            const markdown = (await response.text()).replace(/^# .*\n/, '');   // the page has its own title
            content.innerHTML = render(markdown);
            loaded = true;
        } catch (e) {
            content.innerHTML = `<p class="message">The guide couldn't be loaded here. You can read it on <a href="${GITHUB_README}" target="_blank" rel="noopener">GitHub</a>.</p>`;
            return;
        }

        // Table of contents: the main sections. The links scroll within the
        // page rather than change the address (which picks the screen).
        toc.innerHTML = '';
        content.querySelectorAll('h2').forEach(h => {
            const link = document.createElement('a');
            link.href = '#help';
            link.textContent = h.textContent || '';
            link.onclick = (event) => { event.preventDefault(); h.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
            toc.append(link);
        });
    }
}

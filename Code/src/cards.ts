/**
 * Robot cards: a trading-card image of a robot with its full source code stored
 * in a visible "code strip" of small shaded blocks. The image shows both sides
 * of the card next to each other: the front (name, art, description) and the
 * back (a listing of the code above the code strip, which grows to fit). Cards
 * can be shared as images; loading one in the shop reads the code back out.
 *
 * How the code strip works:
 * - The code is compressed, followed by a checksum, and split into Reed-Solomon
 *   blocks (the error correction QR codes use), so small damage is repaired and
 *   anything worse is rejected rather than loaded garbled.
 * - Each block of the strip is one of four brightness levels (2 bits). JPEG
 *   compression keeps brightness much better than colour, so the strip survives
 *   re-compression even though it is tinted to match the card.
 * - The bottom row of the strip is a calibration row of all four shades, and the
 *   strip sits at a fixed place on the card, so it is found and read correctly
 *   even after the image is resized.
 * - Older cards (front only, 750 x 1050, with a smaller strip on the front) can
 *   still be read.
 */
namespace Cards {

    // ------------------------------------------------------------------------
    // Card geometry. Each side of the card is 750 x 1050 (2.5 x 3.5 inches at
    // 300 dpi); the image shows the front and the back side by side.
    // ------------------------------------------------------------------------
    export const SIDE = 750;
    export const WIDTH = 2 * SIDE, HEIGHT = 1050;
    export const LOAD_URL = 'https://darozak.github.io/Advolition/';
    const CELL = 3;                                   // size of one strip block, in pixels
    const MIN_DATA_ROWS = 8;

    // Where a card's strip is. The strip is anchored at its bottom edge and grows
    // upwards only as far as the code needs. Row 0 (the bottom row) is
    // calibration; data rows stack above it.
    interface Layout { width: number, height: number, x: number, bottom: number, cols: number, rows: number, maxBlocks: number }
    const layout = (width: number, x: number, bottom: number, maxHeight: number): Layout => {
        const cols = Math.floor(690 / CELL), rows = Math.floor(maxHeight / CELL);
        const capacity = Math.floor((cols * (rows - 1)) / 4);
        return { width, height: HEIGHT, x, bottom, cols, rows, maxBlocks: Math.floor((capacity - META_DATA - META_PARITY) / (RS_DATA + RS_PARITY)) };
    };
    const RS_DATA = 223, RS_PARITY = 32;              // Reed-Solomon (255, 223): fixes 16 bad bytes per block
    const META_DATA = 8, META_PARITY = 16;            // a small, heavily protected header
    /** Cards made now: the strip fills the back, up to just under the title bar. */
    const CARD = layout(WIDTH, SIDE + 30, 966, 864);
    /** The first cards: front only, with a small strip at the bottom. Read only. */
    const OLD_CARD = layout(SIDE, 30, 966, 180);
    const rowTop = (L: Layout, row: number) => L.bottom - (row + 1) * CELL;

    const MAGIC = [65, 68, 86, 1];                    // "ADV" + format version 1

    // Four brightness levels (luma). Symbols use a Gray code, so mixing up two
    // neighbouring shades only flips one bit.
    const LEVEL_LUMA = [18, 92, 166, 240];
    const GRAY = [0, 1, 3, 2];                        // 2-bit value -> level index
    const UNGRAY = [0, 1, 3, 2];                      // level index -> 2-bit value

    const MAX_PAYLOAD = CARD.maxBlocks * RS_DATA;
    /** The most compressed code a card can hold, in bytes. */
    export const MAX_PACKED = MAX_PAYLOAD - 4;

    // ------------------------------------------------------------------------
    // Reed-Solomon over GF(256), polynomial 0x11d ("Reed-Solomon codes for coders").
    // Polynomials are arrays with the highest-degree coefficient first.
    // ------------------------------------------------------------------------
    const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
    (() => {
        let x = 1;
        for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
        for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
    })();
    const gmul = (a: number, b: number) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
    const gdiv = (a: number, b: number) => a ? EXP[(LOG[a] + 255 - LOG[b]) % 255] : 0;
    const gpow = (a: number, n: number) => EXP[(LOG[a] * n) % 255];
    const ginv = (a: number) => EXP[255 - LOG[a]];

    function polyMul(p: number[], q: number[]) {
        const r = new Array(p.length + q.length - 1).fill(0);
        for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) r[i + j] ^= gmul(p[i], q[j]);
        return r;
    }
    function polyEval(p: number[], x: number) {
        let y = p[0];
        for (let i = 1; i < p.length; i++) y = gmul(y, x) ^ p[i];
        return y;
    }
    function polyAdd(p: number[], q: number[]) {
        const r = new Array(Math.max(p.length, q.length)).fill(0);
        for (let i = 0; i < p.length; i++) r[i + r.length - p.length] = p[i];
        for (let i = 0; i < q.length; i++) r[i + r.length - q.length] ^= q[i];
        return r;
    }
    const polyScale = (p: number[], x: number) => p.map(c => gmul(c, x));

    function rsEncode(data: number[], nsym: number) {
        let gen = [1];
        for (let i = 0; i < nsym; i++) gen = polyMul(gen, [1, EXP[i]]);
        const out = data.concat(new Array(nsym).fill(0));
        for (let i = 0; i < data.length; i++) {
            const c = out[i];
            if (c) for (let j = 1; j < gen.length; j++) out[i + j] ^= gmul(gen[j], c);
        }
        return data.concat(out.slice(data.length));
    }

    /** Repairs a block. Returns its data and how many bytes were fixed, or null if it can't be repaired. */
    function rsDecode(input: number[], nsym: number): { data: number[], fixed: number } | null {
        const msg = input.slice();
        const synd = [0];
        let bad = false;
        for (let i = 0; i < nsym; i++) { const v = polyEval(msg, EXP[i]); synd.push(v); if (v) bad = true; }
        if (!bad) return { data: msg.slice(0, msg.length - nsym), fixed: 0 };

        // Berlekamp-Massey: the error locator polynomial.
        let errLoc = [1], oldLoc = [1];
        for (let i = 0; i < nsym; i++) {
            const K = i + 1;
            let delta = synd[K];
            for (let j = 1; j < errLoc.length; j++) delta ^= gmul(errLoc[errLoc.length - 1 - j], synd[K - j]);
            oldLoc = oldLoc.concat([0]);
            if (delta) {
                if (oldLoc.length > errLoc.length) { const newLoc = polyScale(oldLoc, delta); oldLoc = polyScale(errLoc, ginv(delta)); errLoc = newLoc; }
                errLoc = polyAdd(errLoc, polyScale(oldLoc, delta));
            }
        }
        while (errLoc.length && errLoc[0] === 0) errLoc.shift();
        const errs = errLoc.length - 1;
        if (errs * 2 > nsym) return null;

        // Chien search: which bytes are wrong.
        const rev = errLoc.slice().reverse(), pos: number[] = [];
        for (let i = 0; i < msg.length; i++) if (polyEval(rev, gpow(2, i)) === 0) pos.push(msg.length - 1 - i);
        if (pos.length !== errs) return null;

        // Forney: the size of each error.
        const coef = pos.map(p => msg.length - 1 - p);
        let errataLoc = [1];
        for (const c of coef) errataLoc = polyMul(errataLoc, polyAdd([1], [gpow(2, c), 0]));
        const prod = polyMul(synd.slice().reverse(), errataLoc);
        const evaluator = prod.slice(Math.max(0, prod.length - errataLoc.length));
        const X = coef.map(c => gpow(2, c));
        for (let i = 0; i < X.length; i++) {
            const xiInv = ginv(X[i]);
            let prime = 1;
            for (let j = 0; j < X.length; j++) if (j !== i) prime = gmul(prime, 1 ^ gmul(xiInv, X[j]));
            if (!prime) return null;
            msg[pos[i]] ^= gdiv(gmul(X[i], polyEval(evaluator, xiInv)), prime);
        }
        for (let i = 0; i < nsym; i++) if (polyEval(msg, EXP[i])) return null;
        return { data: msg.slice(0, msg.length - nsym), fixed: errs };
    }

    // ------------------------------------------------------------------------
    // Packing the code into bytes, and back.
    // ------------------------------------------------------------------------
    function crc32(bytes: Uint8Array) {
        let crc = 0xffffffff;
        for (const b of bytes) {
            let c = (crc ^ b) & 0xff;
            for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
            crc = (crc >>> 8) ^ c;
        }
        return (crc ^ 0xffffffff) >>> 0;
    }
    async function deflate(bytes: Uint8Array) {
        return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
    }
    async function inflate(bytes: Uint8Array) {
        return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    }

    // Every byte is XORed with a fixed pseudo-random stream before it is drawn
    // (and again after it is read), so runs of identical bytes don't show up as
    // stripes. QR codes use masks for the same reason.
    function scramble(bytes: number[]) {
        let s = 0x41445631;
        return bytes.map(b => {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return b ^ (((t ^ (t >>> 14)) >>> 0) & 255);
        });
    }

    export interface Packed { bytes: number[], blocks: number, packed: number, raw: number }

    /** Packs code for a card. Throws if it is too big to fit. */
    export async function pack(code: string): Promise<Packed> {
        const text = new TextEncoder().encode(code);
        const packed = await deflate(text);
        const crc = crc32(text);
        const payload = Array.from(packed).concat([crc >>> 24, (crc >>> 16) & 255, (crc >>> 8) & 255, crc & 255]);
        if (payload.length > MAX_PAYLOAD) {
            throw new Error(`This script is too big to fit on a card: it packs to ${packed.length.toLocaleString()} bytes, and a card holds ${MAX_PACKED.toLocaleString()}. It can still battle.`);
        }
        const blocks = Math.ceil(payload.length / RS_DATA);
        const out = rsEncode([...MAGIC, blocks, packed.length >> 8, packed.length & 255, 0], META_PARITY);
        // Encode each block, then interleave so a damaged patch is spread over many blocks.
        const encoded: number[][] = [];
        for (let b = 0; b < blocks; b++) {
            const chunk = payload.slice(b * RS_DATA, (b + 1) * RS_DATA);
            while (chunk.length < RS_DATA) chunk.push(0);
            encoded.push(rsEncode(chunk, RS_PARITY));
        }
        for (let i = 0; i < 255; i++) for (let b = 0; b < blocks; b++) out.push(encoded[b][i]);
        return { bytes: out, blocks, packed: packed.length, raw: text.length };
    }

    export type ReadResult = { ok: true, code: string, fixed: number } | { ok: false, reason: string };

    async function unpack(bytes: number[], maxBlocks: number): Promise<ReadResult> {
        const meta = rsDecode(bytes.slice(0, META_DATA + META_PARITY), META_PARITY);
        if (!meta || MAGIC.some((m, i) => meta.data[i] !== m)) return { ok: false, reason: 'No Advolition code strip was found on this image.' };
        const blocks = meta.data[4], length = (meta.data[5] << 8) | meta.data[6];
        if (!blocks || blocks > maxBlocks) return { ok: false, reason: "The card's code strip is damaged." };
        const body = bytes.slice(META_DATA + META_PARITY);
        let packed: number[] = [], fixed = meta.fixed;
        for (let b = 0; b < blocks; b++) {
            const block: number[] = [];
            for (let i = 0; i < 255; i++) block.push(body[i * blocks + b]);
            const r = rsDecode(block, RS_PARITY);
            if (!r) return { ok: false, reason: "The card's code strip is too damaged to repair. The image was probably re-compressed or shrunk too much; try the original image." };
            fixed += r.fixed;
            packed = packed.concat(r.data);
        }
        const c = packed.slice(length, length + 4);
        const crc = ((c[0] << 24) | (c[1] << 16) | (c[2] << 8) | c[3]) >>> 0;
        let text: Uint8Array;
        try { text = await inflate(new Uint8Array(packed.slice(0, length))); }
        catch (e) { return { ok: false, reason: "The card's code could not be unpacked." }; }
        if (crc32(text) !== crc) return { ok: false, reason: "The card's code failed its checksum, so it wasn't loaded." };
        return { ok: true, code: new TextDecoder('utf-8', { ignoreBOM: true }).decode(text), fixed };
    }

    // ------------------------------------------------------------------------
    // What the card shows about a robot, read from its code.
    // ------------------------------------------------------------------------
    export interface RobotInfo {
        name: string,
        tagline: string,
        abilities: string[],
        traits: string[],
        fields: { [key: string]: string },
        lines: number,
    }

    /**
     * Reads a robot's name (its Program class), and from the comment block at the
     * top of its code: the special fields "// @description", "// @designer" (or
     * "// @author") and "// @version", a tagline (the first comment line) and a
     * numbered list of abilities. Traits are guessed from the actions it uses.
     */
    // The robot's name: the class that extends Program. Only classes declared at
    // the start of a line count (not ones mentioned in comments); if there are
    // several, the one the file creates at the end (`new Name();`) wins.
    function robotName(code: string): string {
        const id = '[\\p{L}\\p{N}_$]+';
        const declared = [...code.matchAll(new RegExp(`^[ \\t]*(?:export\\s+)?class\\s+(${id})\\s+extends\\s+Program\\b`, 'gmu'))].map(m => m[1]);
        const created = (code.match(new RegExp(`new\\s+(${id})\\s*\\(\\s*\\)\\s*;?\\s*$`, 'u')) || [])[1];
        if (created && declared.includes(created)) return created;
        if (declared.length) return declared[0];
        return (code.match(new RegExp(`class\\s+(${id})\\s+extends\\s+Program\\b`, 'u')) || [])[1] || 'Unnamed Robot';
    }

    export function describe(code: string): RobotInfo {
        const name = robotName(code);
        const header: string[] = [];
        for (const line of code.split('\n')) {
            const t = line.trim();
            if (t.startsWith('//')) header.push(t.replace(/^\/\/\s*/, ''));
            else if (t) break;
        }
        // A field's text can continue on the following comment lines, up to a blank one.
        const fields: { [key: string]: string } = {};
        let field: string | null = null;
        for (const l of header) {
            const m = l.match(/^@(\w+)\s*(.*)$/);
            if (m) { field = m[1].toLowerCase(); fields[field] = m[2].trim(); }
            else if (field && l) fields[field] += ' ' + l;
            else field = null;
        }
        if (!fields.designer && fields.author) fields.designer = fields.author;
        const plain = header.filter(l => !/^@\w+/.test(l));
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        let tagline = (plain[0] || '').replace(new RegExp('^' + escapedName + ':\\s*', 'iu'), '');
        tagline = tagline.charAt(0).toUpperCase() + tagline.slice(1);
        const abilities: string[] = [];
        let inAbility = false;
        for (const l of header) {
            if (/^\d+\.\s/.test(l)) { abilities.push(l.replace(/^\d+\.\s*/, '')); inAbility = true; }
            else if (inAbility && l) abilities[abilities.length - 1] += ' ' + l;
            else inAbility = false;
        }
        const traits: string[] = [];
        if (/new Take\(/.test(code)) traits.push('Collector');
        if (/new Drop\(/.test(code)) traits.push('Banker');
        if (/findPath|[Ff]rontier/.test(code)) traits.push('Explorer');
        if (/new Attack\(/.test(code)) traits.push(/lastHit/.test(code) ? 'Retaliator' : 'Fighter');
        for (const w of ['Railgun', 'Ion Gun', 'Blaster', 'Shield']) if (code.includes(w) && traits.length < 6) traits.push(w);
        return { name, tagline, abilities, traits, fields, lines: code.split('\n').length };
    }

    // ------------------------------------------------------------------------
    // Drawing.
    // ------------------------------------------------------------------------
    function hashString(s: string) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
        return h >>> 0;
    }
    const hsl = (h: number, s: number, l: number) => `hsl(${h},${s}%,${l}%)`;

    /** The card's colour (its hue, 0-359), which is derived from the code. */
    export const hueOf = (code: string) => hashString(code) % 360;

    // An RGB colour of exactly the given luma, in the card's hue.
    function stripColour(hue: number, luma: number) {
        const c = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
        c.fillStyle = hsl(hue, 55, 50);
        c.fillRect(0, 0, 1, 1);
        const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
        const base = 0.299 * r + 0.587 * g + 0.114 * b;
        let k: number;
        if (luma <= base) { k = luma / base; return [r * k, g * k, b * k].map(Math.round); }
        k = (luma - base) / (255 - base);
        return [r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k].map(Math.round);
    }

    // Draws one line of text no wider than maxW: the font shrinks down to
    // minSize, and then the text is cut short with "…".
    function fitText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, font: (size: number) => string, size: number, minSize: number) {
        ctx.font = font(size);
        while (size > minSize && ctx.measureText(text).width > maxW) ctx.font = font(--size);
        if (ctx.measureText(text).width > maxW) {
            while (text && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
            text += '…';
        }
        ctx.fillText(text, x, y);
    }

    function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number) {
        const words = text.split(/\s+/);
        let line = '', lines = 0;
        for (let i = 0; i < words.length; i++) {
            const test = line ? line + ' ' + words[i] : words[i];
            if (ctx.measureText(test).width > maxW && line) {
                if (lines === maxLines - 1) {
                    while (ctx.measureText(line + '…').width > maxW) line = line.slice(0, -1);
                    ctx.fillText(line + '…', x, y);
                    return y + lineH;
                }
                ctx.fillText(line, x, y, maxW); y += lineH; lines++; line = words[i];
            } else line = test;
        }
        if (line) { ctx.fillText(line, x, y, maxW); y += lineH; }
        return y;
    }

    // A robot portrait, generated from the code so every robot looks different.
    function drawRobotArt(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, hue: number) {
        const bg = ctx.createLinearGradient(x, y, x, y + h);
        bg.addColorStop(0, hsl(hue, 30, 16)); bg.addColorStop(1, hsl(hue, 35, 8));
        ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = hsl(hue, 25, 22); ctx.lineWidth = 1;
        for (let gx = x; gx < x + w; gx += 30) { ctx.beginPath(); ctx.moveTo(gx + 0.5, y); ctx.lineTo(gx + 0.5, y + h); ctx.stroke(); }
        for (let gy = y; gy < y + h; gy += 30) { ctx.beginPath(); ctx.moveTo(x, gy + 0.5); ctx.lineTo(x + w, gy + 0.5); ctx.stroke(); }
        const rnd = (n: number) => { seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0; seed ^= seed >>> 13; return (seed % 1000) / 1000 * n; };
        const cx = x + w / 2, cy = y + h / 2 + 20;
        const bodyW = 170 + rnd(60), bodyH = 120 + rnd(40), headW = 120 + rnd(50), headH = 80 + rnd(30);
        const main = hsl(hue, 60, 55), dark = hsl(hue, 55, 32), light = hsl(hue, 70, 75), eye = hsl((hue + 180) % 360, 90, 60);
        const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 230);
        glow.addColorStop(0, hsl(hue, 80, 50)); glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.25; ctx.fillStyle = glow; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
        const rr = (rx: number, ry: number, rw: number, rh: number, r: number, fill: string) => {
            ctx.beginPath(); ctx.roundRect(rx, ry, rw, rh, r); ctx.fillStyle = fill; ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.stroke();
        };
        // Legs or treads
        if (rnd(1) < 0.5) {
            rr(cx - bodyW / 2 - 10, cy + bodyH / 2 - 10, 50, 60, 14, dark);
            rr(cx + bodyW / 2 - 40, cy + bodyH / 2 - 10, 50, 60, 14, dark);
        } else {
            rr(cx - bodyW / 2 - 15, cy + bodyH / 2 - 5, bodyW + 30, 46, 22, dark);
            for (let k = 0; k < 6; k++) { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - bodyW / 2 + 10 + k * (bodyW / 5), cy + bodyH / 2 + 18, 10, 0, 7); ctx.fill(); }
        }
        // Arms, body and chest panel
        rr(cx - bodyW / 2 - 38, cy - 20, 36, 90, 16, dark);
        rr(cx + bodyW / 2 + 2, cy - 20, 36, 90, 16, dark);
        rr(cx - bodyW / 2, cy - bodyH / 2, bodyW, bodyH, 22, main);
        rr(cx - bodyW / 4, cy - bodyH / 4, bodyW / 2, bodyH / 2, 10, dark);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = [eye, light, '#fff'][k]; ctx.beginPath(); ctx.arc(cx - 24 + k * 24, cy, 7, 0, 7); ctx.fill(); }
        // Head, antenna and eyes
        const hy = cy - bodyH / 2 - headH + 8;
        ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, hy); ctx.lineTo(cx + rnd(30) - 15, hy - 40 - rnd(30)); ctx.stroke();
        ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(cx, hy - 45 - rnd(10), 10, 0, 7); ctx.fill();
        rr(cx - headW / 2, hy, headW, headH, 18, light);
        const eyes = 1 + Math.floor(rnd(2.99));
        for (let k = 0; k < eyes; k++) {
            const ex = cx + (k - (eyes - 1) / 2) * 38;
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex, hy + headH / 2, 15, 0, 7); ctx.fill();
            ctx.fillStyle = eye; ctx.beginPath(); ctx.arc(ex, hy + headH / 2, 8, 0, 7); ctx.fill();
        }
    }

    /**
     * Draws a robot's card onto a canvas, with its code in the code strip.
     * Throws if the code is too big to fit on a card.
     */
    export async function draw(canvas: HTMLCanvasElement, code: string) {
        const packed = await pack(code);
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        canvas.width = WIDTH; canvas.height = HEIGHT;
        const info = describe(code);
        const seed = hashString(code), hue = seed % 360;
        const cardID = crc32(new TextEncoder().encode(code)).toString(16).toUpperCase().padStart(8, '0');

        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
        drawFront(ctx, info, packed, seed, hue, cardID);
        ctx.save(); ctx.translate(SIDE, 0);
        const stripTop = drawBackFrame(ctx, info, packed, hue, cardID, code);
        ctx.restore();
        drawStrip(ctx, packed, seed, hue, stripTop);
        return { info, packed, hue };
    }

    // A card side's frame, background and footer (where to load the card).
    function drawSideFrame(ctx: CanvasRenderingContext2D, hue: number) {
        ctx.beginPath(); ctx.roundRect(6, 6, SIDE - 12, HEIGHT - 12, 34);
        const frame = ctx.createLinearGradient(0, 0, SIDE, HEIGHT);
        frame.addColorStop(0, hsl(hue, 55, 45)); frame.addColorStop(1, hsl((hue + 40) % 360, 55, 28));
        ctx.fillStyle = frame; ctx.fill();
        ctx.beginPath(); ctx.roundRect(22, 22, SIDE - 44, HEIGHT - 44, 22); ctx.fillStyle = '#141414'; ctx.fill();

        const y = CARD.bottom + 12;
        ctx.fillStyle = hsl(hue, 45, 22); ctx.beginPath(); ctx.roundRect(30, y, SIDE - 60, 38, 10); ctx.fill();
        ctx.font = 'bold 19px Arial'; ctx.textAlign = 'left';
        const lead = 'Load this card at ';
        const startX = SIDE / 2 - (ctx.measureText(lead).width + ctx.measureText(LOAD_URL).width) / 2;
        ctx.fillStyle = '#fff'; ctx.fillText(lead, startX, y + 26);
        ctx.fillStyle = hsl(hue, 85, 78); ctx.fillText(LOAD_URL, startX + ctx.measureText(lead).width, y + 26);
    }

    function drawFront(ctx: CanvasRenderingContext2D, info: RobotInfo, packed: Packed, seed: number, hue: number, cardID: string) {
        drawSideFrame(ctx, hue);

        // Title bar
        ctx.fillStyle = hsl(hue, 45, 22); ctx.beginPath(); ctx.roundRect(30, 30, SIDE - 60, 74, 14); ctx.fill();
        ctx.font = 'bold 20px Arial'; ctx.textAlign = 'right'; ctx.fillStyle = hsl(hue, 80, 80);
        ctx.fillText('ADVOLITION', SIDE - 48, 74);
        const nameSpace = SIDE - 96 - ctx.measureText('ADVOLITION').width - 24;
        ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
        fitText(ctx, info.name, 48, 80, nameSpace, size => `bold ${size}px Arial`, 40, 24);

        // Art window
        ctx.save(); ctx.beginPath(); ctx.roundRect(30, 114, SIDE - 60, 380, 14); ctx.clip();
        drawRobotArt(ctx, 30, 114, SIDE - 60, 380, seed, hue);
        ctx.restore();
        ctx.lineWidth = 3; ctx.strokeStyle = hsl(hue, 50, 40); ctx.beginPath(); ctx.roundRect(30, 114, SIDE - 60, 380, 14); ctx.stroke();

        // Trait badges
        let tx = 30;
        ctx.font = 'bold 17px Arial'; ctx.textAlign = 'left';
        for (const t of info.traits) {
            const w = ctx.measureText(t).width + 26;
            if (tx + w > SIDE - 30) break;
            ctx.fillStyle = hsl(hue, 50, 28); ctx.beginPath(); ctx.roundRect(tx, 512, w, 32, 16); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText(t, tx + 13, 534);
            tx += w + 8;
        }

        // Text box
        const boxBottom = 880;
        ctx.fillStyle = '#1e1e1e'; ctx.beginPath(); ctx.roundRect(30, 556, SIDE - 60, boxBottom - 556, 12); ctx.fill();
        let y = 588;
        const f = info.fields;
        ctx.textAlign = 'left';
        if (f.description || f.designer || f.version) {
            // The code's special fields: description, designer and version.
            const details = [['Designed by', f.designer], ['Version', f.version]].filter(([, v]) => v);
            const detailSpace = details.length ? details.length * 26 + 14 : 0;
            if (f.description) {
                ctx.fillStyle = '#eee'; ctx.font = 'italic 20px Georgia, serif';
                y = wrapText(ctx, f.description, 48, y, SIDE - 96, 26, Math.max(1, Math.floor((boxBottom - y - detailSpace) / 26))) + 8;
            }
            for (const [label, value] of details) {
                ctx.font = 'bold 17px Arial'; ctx.fillStyle = hsl(hue, 70, 65); ctx.fillText(label, 48, y);
                const lw = ctx.measureText(label + '  ').width;
                ctx.fillStyle = '#e6e6e6';
                fitText(ctx, value, 48 + lw, y, SIDE - 96 - lw, size => `${size}px Arial`, 17, 13);
                y += 26;
            }
        } else {
            // Otherwise: the first comment line and the numbered list.
            ctx.fillStyle = '#eee'; ctx.font = 'italic 19px Georgia, serif';
            if (info.tagline) y = wrapText(ctx, info.tagline, 48, y, SIDE - 96, 24, 2) + 6;
            ctx.font = '17px Arial';
            for (const a of info.abilities) {
                if (y + 22 > boxBottom) break;
                ctx.fillStyle = hsl(hue, 70, 65); ctx.fillText('◆', 48, y);
                ctx.fillStyle = '#cfcfcf';
                y = wrapText(ctx, a, 72, y, SIDE - 120, 22, Math.floor((boxBottom - y) / 22) > 3 ? 2 : 1);
            }
        }

        // Stats panel
        ctx.fillStyle = hsl(hue, 30, 15); ctx.beginPath(); ctx.roundRect(30, 892, SIDE - 60, 66, 12); ctx.fill();
        ctx.font = 'bold 14px Arial'; ctx.fillStyle = hsl(hue, 60, 70); ctx.textAlign = 'left';
        ctx.fillText(`CARD ID ${cardID}`, 48, 918);
        ctx.textAlign = 'right'; ctx.fillStyle = '#bdbdbd';
        ctx.fillText('Full code on the back ▸', SIDE - 48, 918);
        ctx.textAlign = 'left'; ctx.font = '15px Arial'; ctx.fillStyle = '#d8d8d8';
        ctx.fillText(`${info.lines.toLocaleString()} lines · ${packed.raw.toLocaleString()} bytes of code · uses ${Math.max(1, Math.round(100 * packed.packed / MAX_PACKED))}% of the card`, 48, 944);
    }

    // The back: frame, title bar and a listing of the code above the strip.
    // Returns the top of the strip.
    function drawBackFrame(ctx: CanvasRenderingContext2D, info: RobotInfo, packed: Packed, hue: number, cardID: string, code: string) {
        drawSideFrame(ctx, hue);

        ctx.fillStyle = hsl(hue, 45, 22); ctx.beginPath(); ctx.roundRect(30, 30, SIDE - 60, 54, 14); ctx.fill();
        ctx.font = 'bold 15px Arial'; ctx.textAlign = 'right'; ctx.fillStyle = hsl(hue, 80, 80);
        ctx.fillText(`CARD ID ${cardID}`, SIDE - 48, 63);
        const idWidth = ctx.measureText(`CARD ID ${cardID}`).width;
        ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
        fitText(ctx, `${info.name} · source code`, 48, 64, SIDE - 120 - idWidth, size => `bold ${size}px Arial`, 22, 14);

        const rows = stripRows(packed);
        const stripTop = rowTop(CARD, rows - 1);

        // The code itself, as far as it fits above the strip.
        const listTop = 100, listBottom = stripTop - 40;
        if (listBottom - listTop > 40) {
            ctx.fillStyle = '#0d0d0d'; ctx.beginPath(); ctx.roundRect(30, listTop, SIDE - 60, listBottom - listTop, 10); ctx.fill();
            ctx.save(); ctx.beginPath(); ctx.rect(30, listTop, SIDE - 60, listBottom - listTop); ctx.clip();
            const lineH = 13, lines = code.replace(/\t/g, '    ').split('\n');
            const fits = Math.floor((listBottom - listTop - 16) / lineH);
            ctx.font = '11px ui-monospace, Menlo, Consolas, monospace'; ctx.textAlign = 'left';
            for (let n = 0; n < Math.min(fits, lines.length); n++) {
                const line = (n === fits - 1 && lines.length > fits) ? `… ${(lines.length - n).toLocaleString()} more lines in the code strip` : lines[n];
                ctx.fillStyle = /^\s*\/\//.test(line) ? '#6a9955' : '#c8c8c8';
                ctx.fillText(line, 44, listTop + 18 + n * lineH);
            }
            ctx.restore();
        }

        // Strip caption
        ctx.font = 'bold 13px Arial'; ctx.fillStyle = '#9a9a9a'; ctx.textAlign = 'left';
        ctx.fillText('CODE STRIP', 30, stripTop - 10);
        ctx.textAlign = 'right';
        ctx.fillText(`${info.lines.toLocaleString()} lines · ${packed.raw.toLocaleString()} bytes · packed ${packed.packed.toLocaleString()} of ${MAX_PACKED.toLocaleString()}`, SIDE - 30, stripTop - 10);
        return stripTop;
    }

    // How many strip rows (calibration included) a packed code needs.
    function stripRows(packed: Packed) {
        return 1 + Math.max(MIN_DATA_ROWS, Math.ceil(packed.bytes.length * 4 / CARD.cols));
    }

    // The code strip: calibration row at the bottom, data rows stacked upwards,
    // then random shades to fill out the last row.
    function drawStrip(ctx: CanvasRenderingContext2D, packed: Packed, seed: number, hue: number, stripTop: number) {
        const symbols: number[] = [];
        for (const byte of scramble(packed.bytes)) for (let s = 6; s >= 0; s -= 2) symbols.push(GRAY[(byte >> s) & 3]);
        const rows = stripRows(packed), cols = CARD.cols;
        const levels = LEVEL_LUMA.map(l => stripColour(hue, l));
        const img = ctx.createImageData(cols * CELL, rows * CELL);
        const fill = (col: number, row: number, level: number) => {
            const [r, g, b] = levels[level], top = (rows - 1 - row) * CELL;
            for (let dy = 0; dy < CELL; dy++) for (let dx = 0; dx < CELL; dx++) {
                const p = ((top + dy) * cols * CELL + col * CELL + dx) * 4;
                img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
            }
        };
        let k = 0, filler = seed;
        const nextFiller = () => {
            filler = (filler + 0x6D2B79F5) >>> 0;
            let t = Math.imul(filler ^ (filler >>> 15), 1 | filler);
            t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
            return ((t ^ (t >>> 14)) >>> 0) % 4;
        };
        for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
            if (row === 0) fill(col, row, Math.floor(col / 2) % 4);
            else if (k < symbols.length) fill(col, row, symbols[k++]);
            else fill(col, row, nextFiller());
        }
        ctx.putImageData(img, CARD.x, stripTop);
        ctx.lineWidth = 2; ctx.strokeStyle = hsl(hue, 50, 40);
        ctx.strokeRect(CARD.x - 3, stripTop - 3, cols * CELL + 6, rows * CELL + 6);
    }

    /**
     * Reads the code back out of a card image (an <img>, ImageBitmap or canvas).
     * The strip is found by scaling its position to the image's size. If that
     * fails, nearby framings are tried too, so a card with a thin border around
     * it, or slightly cropped or shifted, still loads.
     */
    export async function read(source: CanvasImageSource & { width: number, height: number }): Promise<ReadResult> {
        const w = source.width, h = source.height;
        if (!w || !h) return { ok: false, reason: "This image couldn't be read." };
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const ctx = c.getContext('2d') as CanvasRenderingContext2D;
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, w, h).data;

        // Two-sided cards are landscape; the first, front-only cards are portrait.
        // Try the layout that matches the image's shape first.
        const layouts = Math.abs(w / h - CARD.width / CARD.height) < Math.abs(w / h - OLD_CARD.width / OLD_CARD.height) ? [CARD, OLD_CARD] : [OLD_CARD, CARD];

        const framings = (L: Layout): [number, number, number, number][] => {
            // [left, top, card width, card height] in image pixels.
            const list: [number, number, number, number][] = [[0, 0, w, h]];
            const unit = w / L.width;                     // one card pixel
            const reach = Math.max(1, Math.round(16 * unit));
            const steps: number[] = [];
            for (let d = 1; d <= reach; d++) steps.push(d, -d);
            const pairs: [number, number][] = [];
            for (const a of [0, ...steps]) for (const b of [0, ...steps]) if (a || b) pairs.push([a, b]);
            pairs.sort((p, q) => Math.abs(p[0]) + Math.abs(p[1]) - Math.abs(q[0]) - Math.abs(q[1]));
            for (const [a, b] of pairs) {
                list.push([a, b, w - 2 * a, h - 2 * b]);   // a border (or crop) on every side
                list.push([a, b, w, h]);                   // the card shifted
            }
            return list;
        };

        // A framing that is nearly right can find the strip's header but misread
        // the rows further down, so keep looking until the whole code checks out.
        let found: ReadResult | null = null;
        for (const L of layouts) for (const [left, top, cw, ch] of framings(L)) {
            if (cw < L.width / 4 || ch < L.height / 4) continue;
            const result = await readAt(L, data, w, h, left, top, cw / L.width, ch / L.height);
            if (result && result.ok) return result;
            if (result && !found) found = result;
        }
        return found || { ok: false, reason: 'No Advolition code strip was found on this image.' };
    }

    // Reads the strip, taking the card to sit at (left, top) in the image at the
    // given scale. Returns null if no strip header is found there.
    async function readAt(L: Layout, data: Uint8ClampedArray, w: number, h: number, left: number, top: number, sx: number, sy: number): Promise<ReadResult | null> {
        // Brightness at the centre of a block, averaged over a small patch.
        const r = Math.max(0, Math.floor(Math.min(sx, sy) * CELL / 2 - 0.5));
        const luma = (col: number, row: number) => {
            const cx = left + (L.x + (col + 0.5) * CELL) * sx, cy = top + (rowTop(L, row) + 0.5 * CELL) * sy;
            let sum = 0, n = 0;
            for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                const px = Math.min(w - 1, Math.max(0, Math.round(cx + dx - 0.5)));
                const py = Math.min(h - 1, Math.max(0, Math.round(cy + dy - 0.5)));
                const p = (py * w + px) * 4;
                sum += 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
                n++;
            }
            return sum / n;
        };

        // Calibrate: the measured brightness of each of the four shades.
        const seen: number[][] = [[], [], [], []];
        for (let col = 0; col < L.cols; col++) seen[Math.floor(col / 2) % 4].push(luma(col, 0));
        const ref = seen.map(v => { v.sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; });
        if (!(ref[0] < ref[1] && ref[1] < ref[2] && ref[2] < ref[3])) return null;   // not a calibration row
        const nearest = (v: number) => { let best = 0; for (let i = 1; i < 4; i++) if (Math.abs(v - ref[i]) < Math.abs(v - ref[best])) best = i; return best; };

        // Read upwards. The first data row holds the protected header, which says
        // how many blocks follow, so only the rows actually used are read.
        const symbols: number[] = [];
        const readRow = (row: number) => { for (let col = 0; col < L.cols; col++) symbols.push(UNGRAY[nearest(luma(col, row))]); };
        const toBytes = () => {
            const out: number[] = [];
            for (let i = 0; i + 3 < symbols.length; i += 4) out.push((symbols[i] << 6) | (symbols[i + 1] << 4) | (symbols[i + 2] << 2) | symbols[i + 3]);
            return scramble(out);
        };
        readRow(1);
        const meta = rsDecode(toBytes().slice(0, META_DATA + META_PARITY), META_PARITY);
        if (!meta || MAGIC.some((m, i) => meta.data[i] !== m)) return null;
        const needed = (META_DATA + META_PARITY + Math.min(meta.data[4], L.maxBlocks) * (RS_DATA + RS_PARITY)) * 4;
        for (let row = 2; symbols.length < needed && row < L.rows; row++) readRow(row);
        return unpack(toBytes(), L.maxBlocks);
    }
}

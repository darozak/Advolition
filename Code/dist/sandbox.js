"use strict";
/**
 * Robot programs run in a sandbox: each one gets its own Web Worker. A program
 * only sees the data it is sent each turn and the action classes it needs
 * (Vector, Program, Move, Scan, ...). It can't reach the game, the page, or
 * other robots' programs.
 */
/**
 * Runs a trusted program directly in the page, without a sandbox. Used for
 * built-in robots and tests, never for uploaded files.
 */
class LocalBot {
    program;
    constructor(program) {
        this.program = program;
    }
    async decide(myData) {
        try {
            return { action: this.program.run(structuredClone(myData)) };
        }
        catch (error) {
            return { error: error instanceof Error ? error.message : String(error) };
        }
    }
    stop() { }
}
/**
 * Runs an uploaded program inside its own Web Worker.
 */
class SandboxedBot {
    // How long a program may take to load or to choose an action. A program
    // that runs over is stopped, and its robot does nothing for the rest of the game.
    static timeLimitMs = 1000;
    worker;
    isStopped = false;
    nextRequestID = 0;
    pending = new Map();
    constructor(worker) {
        this.worker = worker;
        this.worker.onmessage = (event) => {
            const message = event.data;
            if (message && message.type === 'decision') {
                const reply = this.pending.get(message.id);
                if (reply) {
                    this.pending.delete(message.id);
                    reply(message.error !== undefined ? { error: message.error } : { action: message.action });
                }
            }
        };
        // Errors the program throws outside run(), such as in a timer, are ignored.
        this.worker.onerror = (event) => event.preventDefault();
    }
    /**
     * Loads a program's source code into a new sandbox. Rejects with a
     * readable message if the code has an error or doesn't create a program.
     */
    static async load(code) {
        // Catch syntax errors first, with their line number, without running anything.
        const syntax = await SandboxedBot.findSyntaxError(code);
        if (syntax)
            throw new Error(`its program has an error on line ${syntax.line}:\n${syntax.message}`);
        return SandboxedBot.start(code);
    }
    /**
     * Checks code for syntax errors without running it. Returns the first
     * error's message and line (and column), or null if the code parses.
     */
    static async findSyntaxError(code) {
        // new Function only parses the code; it never runs it.
        try {
            new Function(code);
            return null;
        }
        catch (e) {
            if (!(e instanceof SyntaxError))
                return null;
        }
        // The parser's exception has no line number, but a worker started from
        // the code reports one when it fails to start. Code with a syntax error
        // never runs at all, so this is safe.
        return new Promise((resolve) => {
            const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }));
            const worker = new Worker(url);
            const done = (result) => {
                clearTimeout(timer);
                worker.terminate();
                URL.revokeObjectURL(url);
                resolve(result);
            };
            const timer = setTimeout(() => done({ message: 'SyntaxError', line: 0, column: 0 }), 2000);
            worker.onerror = (event) => {
                event.preventDefault();
                done({ message: String(event.message).replace(/^Uncaught /, ''), line: event.lineno, column: event.colno });
            };
        });
    }
    static start(code) {
        const source = new Blob([SandboxedBot.workerSource()], { type: 'text/javascript' });
        const url = URL.createObjectURL(source);
        const worker = new Worker(url);
        URL.revokeObjectURL(url);
        return new Promise((resolve, reject) => {
            const fail = (reason) => {
                clearTimeout(timer);
                worker.terminate();
                reject(new Error(reason));
            };
            const timer = setTimeout(() => fail(`it took longer than ${SandboxedBot.timeLimitMs} ms to load.`), SandboxedBot.timeLimitMs);
            worker.onmessage = (event) => {
                if (!event.data || event.data.type !== 'loaded')
                    return;
                if (event.data.error) {
                    fail(event.data.error);
                }
                else {
                    clearTimeout(timer);
                    resolve(new SandboxedBot(worker));
                }
            };
            worker.onerror = (event) => {
                event.preventDefault();
                fail(`its program has an error:\n${event.message}`);
            };
            worker.postMessage({ type: 'load', code: code });
        });
    }
    decide(myData) {
        if (this.isStopped)
            return Promise.resolve({});
        const id = this.nextRequestID++;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                this.stop();
                resolve({ error: `Program stopped: took longer than ${SandboxedBot.timeLimitMs} ms` });
            }, SandboxedBot.timeLimitMs);
            this.pending.set(id, (decision) => {
                clearTimeout(timer);
                resolve(decision);
            });
            this.worker.postMessage({ type: 'run', id: id, myData: myData });
        });
    }
    stop() {
        if (this.isStopped)
            return;
        this.isStopped = true;
        this.worker.terminate();
        // Answer any request still waiting so the game never stalls.
        this.pending.forEach((reply) => reply({}));
        this.pending.clear();
    }
    /**
     * The code that runs inside the worker: the action classes a program can
     * use, plus a small message handler that loads the program and calls run().
     */
    static workerSource() {
        const api = [Vector, Action, Attack, Move, Take, Drop, Equip, Unequip, Scan, Say, Program, findPath]
            .map((apiClass) => apiClass.toString())
            .join('\n\n');
        return `${api}

// Cut the program off from everything but its own messages with the game:
// no channels shared with other robots' workers (BroadcastChannel, storage,
// locks), no new workers, and no network. Each name is removed from the
// worker's global object and its prototypes, then pinned to undefined.
for (const name of ['BroadcastChannel', 'indexedDB', 'caches', 'Worker', 'SharedWorker',
        'fetch', 'XMLHttpRequest', 'WebSocket', 'WebTransport', 'EventSource', 'importScripts']) {
    for (let o = self; o; o = Object.getPrototypeOf(o)) {
        try { delete o[name]; } catch (e) {}
    }
    try { Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false }); } catch (e) {}
}
for (let o = self.navigator; o; o = Object.getPrototypeOf(o)) {
    try { delete o.locks; } catch (e) {}
    try { delete o.storage; } catch (e) {}
}

let program = null;

// Whatever was thrown, describe it as text (so one odd error only costs a
// turn), with the line in the program where it happened, when known.
function describeError(e, withName) {
    let text;
    try { text = String(withName || !(e && e.message !== undefined) ? e : e.message); }
    catch (e2) { text = 'an error that could not be shown as text'; }
    try {
        const at = e && typeof e.stack === 'string' && e.stack.match(/<anonymous>:(\\d+):(\\d+)\\)/);
        if (at) text += ' (line ' + at[1] + ')';
    } catch (e3) {}
    return text;
}

self.onmessage = (event) => {
    const message = event.data;

    if (message.type === 'load') {
        let error = null;
        try {
            // Indirect eval runs the code in the worker's global scope.
            program = (0, eval)(message.code);
            if (!program || typeof program.run !== 'function') {
                error = "its program file must end by creating the program, for example: new MyProgram();";
            }
        } catch (e) {
            error = "its program has an error:\\n" + describeError(e, true);
        }
        self.postMessage({ type: 'loaded', error: error });

    } else if (message.type === 'run') {
        try {
            const action = program.run(message.myData);
            self.postMessage({ type: 'decision', id: message.id, action: action });
        } catch (e) {
            self.postMessage({ type: 'decision', id: message.id, error: describeError(e) });
        }
    }
};
`;
    }
}

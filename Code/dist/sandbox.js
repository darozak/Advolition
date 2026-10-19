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
    static load(code) {
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

let program = null;

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
            error = "its program has an error:\\n" + e;
        }
        self.postMessage({ type: 'loaded', error: error });

    } else if (message.type === 'run') {
        try {
            const action = program.run(message.myData);
            self.postMessage({ type: 'decision', id: message.id, action: action });
        } catch (e) {
            const text = (e && e.message) ? e.message : String(e);
            self.postMessage({ type: 'decision', id: message.id, error: text });
        }
    }
};
`;
    }
}

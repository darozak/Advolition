"use strict";
class Robot {
    #data;
    #engine;
    constructor(data) {
        this.#data = data;
        this.#engine = new Engine(data);
    }
    wait(time) {
        /**
         * Waits for time to pass.
         *
         * @param time - amount of time in seconds.
         */
        this.#engine.wait(time);
    }
    move(direction) {
        this.#engine.addAction("move", direction, 4);
    }
    get status() {
        return structuredClone(this.#engine.status);
    }
}

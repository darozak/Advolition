"use strict";
class Robot {
    #data;
    #engine;
    constructor(data) {
        this.#data = data;
        this.#engine = new Engine(data);
    }
    wait(time) {
        this.#engine.wait(time);
    }
    move(direction) {
        this.#engine.addAction("move", direction, 4);
    }
    get status() {
        return structuredClone(this.#engine.status);
    }
}

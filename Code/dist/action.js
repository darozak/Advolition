"use strict";
class Action {
    #params = {
        command: "",
        power: 0,
        coord: new Vector(0, 0),
        range: 0
    };
    constructor() { }
    move(power, destination) {
        this.#params.command = "move";
        this.#params.power = this.#boundPower(power);
        this.#params.coord = destination;
    }
    activate(target) {
        this.#params.command = "activate";
        this.#params.coord = target;
    }
    scan(power) {
        this.#params.command = "scan";
        this.#params.power = this.#boundPower(power);
    }
    #boundPower(power) {
        if (power < 0 || power > 2) {
            return 0;
        }
        return power;
    }
    get params() {
        return this.#params;
    }
}

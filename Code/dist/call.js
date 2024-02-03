"use strict";
class Call {
    #params = {
        command: "",
        power: 0,
        coord: new Vector(0, 0),
    };
    constructor() {
    }
    move(power, destination) {
        this.#params.command = "move";
        this.#params.power = power;
        this.#params.coord = destination;
    }
    scan(power) {
        this.#params.command = "scan";
        this.#params.power = power;
    }
    get params() {
        return this.#params;
    }
}

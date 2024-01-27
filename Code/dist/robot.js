"use strict";
class Robot {
    // #direction = [
    //     new Vector(0,-1),
    //     new Vector(1,-1),
    //     new Vector(1,0),
    //     new Vector(1,1),
    //     new Vector(0,1),
    //     new Vector(-1,1),
    //     new Vector(-1,0),
    //     new Vector(-1,-1)
    // ]
    // #stats = {
    //     pos: new Vector(0,3),
    //     targ: new Vector(0,3),
    //     tile: "x",
    //     speed: 1.0 // Meters per second
    // }
    #data;
    #engine;
    // #dungeon: Dungeon;
    constructor(data) {
        this.#data = data;
        // this.#dungeon = new Dungeon(data);
        this.#engine = new Engine(data);
        // this.#stats.pos = this.#dungeon.enter;
        // this.#stats.targ = this.#dungeon.enter;
        // this.#stats.tile = this.#dungeon.getTile(this.#stats.pos);
    }
    move(dir) {
        this.#engine.addAction("move", dir, 0);
    }
    get status() {
        return structuredClone(this.#engine.status);
    }
}

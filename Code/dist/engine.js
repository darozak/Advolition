"use strict";
class Engine {
    #world;
    #actions;
    #dungeon;
    #direction = [
        new Vector(0, -1),
        new Vector(1, -1),
        new Vector(1, 0),
        new Vector(1, 1),
        new Vector(0, 1),
        new Vector(-1, 1),
        new Vector(-1, 0),
        new Vector(-1, -1)
    ];
    #status = {
        pos: new Vector(0, 3),
        targ: new Vector(0, 3),
        tile: "x",
        speed: 1.0 // Meters per second
    };
    constructor(world) {
        this.#world = world;
        this.#dungeon = new Dungeon(world);
        this.#actions = [];
        this.#status.pos = this.#dungeon.enter;
        this.#status.targ = this.#dungeon.enter;
        this.#status.tile = this.#dungeon.getTile(this.#status.pos);
    }
    addAction(type, params, delay) {
        this.#actions.push(new Action(type, params, delay));
        this.evaluate();
    }
    move(dir) {
        this.#status.targ = this.#status.pos.add(this.#direction[dir]);
        console.log(this.#dungeon.getTileID(this.#status.targ));
        if (this.#dungeon.getTileSpeed(this.#status.targ) > 0) {
            this.#status.pos = this.#status.targ;
        }
    }
    evaluate() {
        if (this.#actions.length > 0) {
            switch (this.#actions[0].type) {
                case "move":
                    this.move(this.#actions[0].params);
            }
            this.#actions.shift();
        }
    }
    get status() {
        this.evaluate();
        return this.#status;
    }
}

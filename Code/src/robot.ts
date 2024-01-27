class Robot {

    #direction = [
        new Vector(0,-1),
        new Vector(1,-1),
        new Vector(1,0),
        new Vector(1,1),
        new Vector(0,1),
        new Vector(-1,1),
        new Vector(-1,0),
        new Vector(-1,-1)
    ]

    #stats = {
        pos: new Vector(0,3),
        targ: new Vector(0,3),
        tile: "x",
        speed: 1.0 // Meters per second
    }

    #data: Data;
    #dungeon: Dungeon;
    
    constructor(data: Data) {
        this.#data = data;
        this.#dungeon = new Dungeon(data);
        this.#stats.pos = this.#dungeon.enter;
        this.#stats.targ = this.#dungeon.enter;
        this.#stats.tile = this.#dungeon.getTile(this.#stats.pos);
    }

    move(dir: number) {
        this.#stats.targ = this.#stats.pos.add(this.#direction[dir]);
        console.log(this.#dungeon.getTileID(this.#stats.targ));

        if (this.#dungeon.getTileSpeed(this.#stats.targ) > 0) {
            this.#stats.pos = this.#stats.targ;
        }
    }

    get stats() {
        return structuredClone(this.#stats);
    }
}

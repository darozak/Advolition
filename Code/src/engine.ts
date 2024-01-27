class Engine {
    #world: World;
    #actions: Action[];
    #dungeon: Dungeon;

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

    #status = {
        time: 0,
        pos: new Vector(0,3),
        targ: new Vector(0,3),
        tile: "x",
        speed: 1.0 // Meters per second
    }

    constructor(world: World) {
        this.#world = world;
        this.#dungeon = new Dungeon(world);
        this.#actions = [];

        this.#status.pos = this.#dungeon.enter;
        this.#status.targ = this.#dungeon.enter;
        this.#status.tile = this.#dungeon.getTile(this.#status.pos);
    }

    wait(time: number) {
        for(let i = 0; i < time; i++) {
            this.#status.time++;
            this.evaluate();
        }
    }

    addAction(type: string, params: any, delay: number) {
        this.#actions.push(new Action(type, params, this.#status.time + delay));
    }

    move(dir: number) {
        this.#status.targ = this.#status.pos.add(this.#direction[dir]);

        if (this.#dungeon.getTileSpeed(this.#status.targ) > 0) {
            this.#status.pos = this.#status.targ;
        }
    }

    evaluate() {
        if(this.#actions.length > 0) {
            this.#actions.sort((a,b) => a.time - b.time);
            if(this.#actions[0].time <= this.#status.time) {
                switch (this.#actions[0].type) {
                    case "move":
                        this.move(this.#actions[0].params);
                }
                this.#actions.shift();
            }
        }   
    }

    get status() {
        return this.#status;
    }
}
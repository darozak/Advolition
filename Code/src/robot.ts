class Robot {
    #data: World;
    #engine: Engine;
    
    constructor(data: World) {
        this.#data = data;
        this.#engine = new Engine(data);
    }

    wait(time: number) {
        this.#engine.wait(time);
    }

    move(direction: number) {
        this.#engine.addAction("move", direction, 4);
    }


    get status() {
        return structuredClone(this.#engine.status);
    }
}

class Robot {
    #data: World;
    #engine: Engine;
    
    constructor(data: World) {
        this.#data = data;
        this.#engine = new Engine(data);
    }

    wait(timer: number) {
        /**
         * Summary
         * Waits for time to pass.
         * @remarks
         * Guess what I'm doing now?
         * @param time - amount of time in seconds.
         */
        this.#engine.wait(timer);
    }

    move(direction: number) {
        this.#engine.addAction("move", direction, 4);
    }


    get status() {
        return structuredClone(this.#engine.status);
    }
}

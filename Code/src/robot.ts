class Robot {
    #data: World;
    #engine: Engine;
    
    constructor(data: World) {
        this.#data = data;
        this.#engine = new Engine(data);
    }

    /**
     * The robot will wait a number of seconds in game time.
     * This will allow scheduled actions to occur.
     * 
     * @param time An amount of time in seconds.
     */
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

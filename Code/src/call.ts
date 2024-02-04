class Call {
    
    #params = {
        command: "",
        power: 0,
        coord: new Vector(0, 0),
        range: 0
    }

    constructor(){
    }

    move(power: number, destination: Vector) {
        this.#params.command = "move";
        this.#params.power = this.#boundPower(power);
        this.#params.coord = destination;
    }

    scan(power: number) {
        this.#params.command = "scan";
        this.#params.power = this.#boundPower(power);
    }

    #boundPower(power: number) {
        if(power < 0 || power > 2) {
            return 0;
        }
        return power;
    }

    get params() {
        return this.#params;
    }
}
class Action {
    
    command: string =  "";
    powerLevel: number = 0;
    target: Vector = new Vector(0, 0);
    range: number = 0;

    constructor(){}
}

class Move extends Action {

    constructor(power: number, destination: Vector) {
        super();
        this.command = "move"
        if(power < 0 || power > 2) this.powerLevel = 0; 
        else this.powerLevel = power;
        this.target = destination;
    }
}

class Activate extends Action {

    constructor(target: Vector) {
        super();
        this.command = "activate";
        this.target = target;
    }
}

class Scan extends Action {
    constructor(power: number) {
        super()
        this.command = "scan";
        if(power < 0 || power > 2) this.powerLevel = 0; 
        else this.powerLevel = power;
    }
}
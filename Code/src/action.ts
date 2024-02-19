class Action {
    
    command: string =  "";
    // powerLevel: number = 0;
    target: Vector = new Vector(0, 0);
    range: number = 0;
    item: string = '';

    constructor(){}
}

class Activate extends Action {

    constructor(target: Vector) {
        super();
        this.command = "activate";
        this.target = target;
    }
}

class Move extends Action {

    constructor(destination: Vector) {
        super();
        this.command = "move"
        // if(power < 0 || power > 2) this.powerLevel = 0; 
        // else this.powerLevel = power;
        this.target = destination;
    }
}

class Prioritize extends Action {

    constructor(item: string) {
        super();
        this.command = "equip";
        this.item = item;
    }
}

class Scan extends Action {
    constructor() {
        super()
        this.command = "scan";
        // if(power < 0 || power > 2) this.powerLevel = 0; 
        // else this.powerLevel = power;
    }
}


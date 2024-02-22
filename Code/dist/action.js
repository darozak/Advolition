"use strict";
class Action {
    command = "";
    // powerLevel: number = 0;
    target = new Vector(0, 0);
    range = 0;
    item = '';
    constructor() { }
}
class Trigger extends Action {
    constructor(target) {
        super();
        this.command = "trigger";
        this.target = target;
    }
}
class Move extends Action {
    constructor(destination) {
        super();
        this.command = "move";
        // if(power < 0 || power > 2) this.powerLevel = 0; 
        // else this.powerLevel = power;
        this.target = destination;
    }
}
class Prioritize extends Action {
    constructor(item) {
        super();
        this.command = "equip";
        this.item = item;
    }
}
class Scan extends Action {
    constructor() {
        super();
        this.command = "scan";
        // if(power < 0 || power > 2) this.powerLevel = 0; 
        // else this.powerLevel = power;
    }
}

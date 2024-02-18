"use strict";
class Action {
    command = "";
    powerLevel = 0;
    target = new Vector(0, 0);
    range = 0;
    item = '';
    constructor() { }
}
class Activate extends Action {
    constructor(target) {
        super();
        this.command = "activate";
        this.target = target;
    }
}
class Equip extends Action {
    constructor(item) {
        super();
        this.command = "equip";
        this.item = item;
    }
}
class Move extends Action {
    constructor(power, destination) {
        super();
        this.command = "move";
        if (power < 0 || power > 2)
            this.powerLevel = 0;
        else
            this.powerLevel = power;
        this.target = destination;
    }
}
class Scan extends Action {
    constructor(power) {
        super();
        this.command = "scan";
        if (power < 0 || power > 2)
            this.powerLevel = 0;
        else
            this.powerLevel = power;
    }
}

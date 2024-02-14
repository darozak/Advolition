"use strict";
class Action {
    command = "";
    powerLevel = 0;
    target = new Vector(0, 0);
    range = 0;
    constructor() { }
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
class Activate extends Action {
    constructor(target) {
        super();
        this.command = "activate";
        this.target = target;
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

"use strict";
class Action {
    command = "";
    target = new Vector(0, 0);
    range = 0;
    item = '';
    message = '';
    constructor() { }
}
class Attack extends Action {
    constructor(target) {
        super();
        this.command = "attack";
        this.target = target;
    }
}
class Move extends Action {
    constructor(destination) {
        super();
        this.command = "move";
        this.target = destination;
    }
}
class Take extends Action {
    constructor(item) {
        super();
        this.command = "take";
        this.item = item;
    }
}
class Drop extends Action {
    constructor(item) {
        super();
        this.command = "drop";
        this.item = item;
    }
}
class Equip extends Action {
    constructor(item) {
        super();
        this.command = "activate";
        this.item = item;
    }
}
class Unequip extends Action {
    constructor(item) {
        super();
        this.command = "inactivate";
        this.item = item;
    }
}
class Scan extends Action {
    constructor() {
        super();
        this.command = "scan";
    }
}
class Say extends Action {
    constructor(message) {
        super();
        this.command = "say";
        this.message = message;
    }
}

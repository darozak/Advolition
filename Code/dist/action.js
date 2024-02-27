"use strict";
class Action {
    command = "";
    target = new Vector(0, 0);
    range = 0;
    item = '';
    constructor() { }
}
// class Trigger extends Action {
//     constructor(target: Vector) {
//         super();
//         this.command = "trigger";
//         this.target = target;
//     }
// }
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
class Activate extends Action {
    constructor(item) {
        super();
        this.command = "activate";
        this.item = item;
    }
}
class Inactivate extends Action {
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

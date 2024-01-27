"use strict";
class Action {
    time;
    type;
    params;
    constructor(type, params, delay) {
        this.type = type;
        this.params = params;
        this.time = delay;
    }
}

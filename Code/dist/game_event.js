"use strict";
class GameEvent {
    duration;
    robotID;
    action;
    // Random number used to order events that finish on the same turn,
    // so lower robot IDs don't always go first.
    tieBreak = rng.getUniform();
    // True once ElectroMagnetic damage has slowed this action.
    slowed = false;
    constructor(botID, call, time) {
        this.robotID = botID;
        this.action = call;
        this.duration = time;
    }
}

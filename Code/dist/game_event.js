"use strict";
class GameEvent {
    duration;
    robotID;
    action;
    constructor(botID, call, time) {
        this.robotID = botID;
        this.action = call;
        this.duration = time;
    }
}

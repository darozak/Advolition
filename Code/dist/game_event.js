"use strict";
class GameEvent {
    time;
    botID;
    call;
    constructor(botID, call, time) {
        this.botID = botID;
        this.call = call;
        this.time = time;
    }
}

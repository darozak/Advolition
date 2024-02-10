class GameEvent {
    
    time: number;
    botID: number;
    call: Action;
    
    constructor(botID: number, call: Action, time: number) {
        this.botID = botID;
        this.call = call;
        this.time = time;
    }
} 
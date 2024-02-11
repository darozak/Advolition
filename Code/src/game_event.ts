class GameEvent {
    
    duration: number;
    robotID: number;
    action: Action;
    
    constructor(botID: number, call: Action, time: number) {
        this.robotID = botID;
        this.action = call;
        this.duration = time;
    }
} 
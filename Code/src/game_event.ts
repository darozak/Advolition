class GameEvent {
    
    duration: number;
    robotID: number;
    action: Action;

    // Random number used to order events that finish on the same turn,
    // so lower robot IDs don't always go first.
    tieBreak: number = rng.getUniform();

    // True once ElectroMagnetic damage has slowed this action.
    slowed = false;
    
    constructor(botID: number, call: Action, time: number) {
        this.robotID = botID;
        this.action = call;
        this.duration = time;
    }
} 
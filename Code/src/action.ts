class Action {
    
    time: number;
    botID: number;
    call: Call;

    constructor(botID: number, call: Call, time: number) {
        this.botID = botID;
        this.call = call;
        this.time = time;
    }  
} 
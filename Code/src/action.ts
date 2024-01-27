class Action {
    
    time: number;
    type: String;
    params: any;

    constructor(type: string, params: any, delay: number) {
        this.type = type;
        this.params = params;
        this.time = Date.now()/1000 + delay;
    }

    
}
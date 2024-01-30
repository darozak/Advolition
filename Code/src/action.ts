class Action {
    
    time: number;
    type: String;
    params: any;

    constructor(type: string, params: any, delay: number) {
        this.type = type;
        this.params = params;
        this.time = delay;
    }  
}
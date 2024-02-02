class Game {
    time: number;
    world: World;
    arena: Arena;
    actions: Action[];
    bots: Robot[];
    stats: Status[];
    paper = new Paper();

    #direction = [
        new Vector(0,-1),
        new Vector(1,-1),
        new Vector(1,0),
        new Vector(1,1),
        new Vector(0,1),
        new Vector(-1,1),
        new Vector(-1,0),
        new Vector(-1,-1)
    ]

    constructor(world: World) {
        this.time = 0;
        this.world = world;
        this.bots = [];
        this.stats = [];
        this.actions = [];

        this.arena = new Arena(world);
        this.arena.generate();

        this.paper.drawTile(new Vector(10,10), new Vector(1,5));
        this.paper.drawTile(new Vector(10,10), new Vector(1,6));
    }

    addBot(bot: Robot) {
        this.bots.push(bot);
        this.stats.push(new Status());
    }

    run() {

        // Cycle through the game loop until an end-game condition is met.
        while(this.time < 10) {

            console.log(structuredClone(this.actions));

            // Increment game time
            this.time ++;

            // Evaluate bots that don't have active actions
            for(var i = 0; i < this.bots.length; i++) {
                if(!this.actions.some(d =>d.botID == i)){
                    var call = new Call();
                    this.bots[i].evaluate(this.world, structuredClone(this.stats[i]), call);
                    switch (call.params.command) {
                        case "move":
                            this.requestMove(i, call);
                            break;
                        case "scan":
                            this.requestScan(i, call);
                            break;
                    }
                }
            }

            // Resolve and remove any actions that are occuring now.
            if(this.actions.length > 0) {
                this.actions.sort((a,b) => a.time - b.time);
                while(this.actions[0].time <= this.time) {
                    switch (this.actions[0].call.params.command) {
                        case "move":
                            this.resolveMove(this.actions[0]);
                            break;
                        case "scan":
                            this.resolveScan(this.actions[0]);
                            break;
                    }
                    this.actions.shift();
                    if(this.actions.length == 0) break;
                }
            }
        } 
    }

    requestMove(botID: number, call: Call) {
        var time = this.time + 0;
        this.actions.push(new Action(botID, call, time)); 
    }

    requestScan(botID: number, call: Call) {
        var time = this.time + 4;
        this.actions.push(new Action(botID, call, time));
    }

    resolveMove(action: Action) {
        var destination = this.stats[action.botID].pos.add(this.#direction[action.call.params.direction]);
        if (this.arena.getTileSpeed(destination) > 0) {
            this.stats[action.botID].pos = destination;
        }
    }

    resolveScan(action: Action) {
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, 5);
    }
}
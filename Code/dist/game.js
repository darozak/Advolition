"use strict";
class Game {
    time;
    world;
    arena;
    actions;
    bots;
    stats;
    #direction = [
        new Vector(0, -1),
        new Vector(1, -1),
        new Vector(1, 0),
        new Vector(1, 1),
        new Vector(0, 1),
        new Vector(-1, 1),
        new Vector(-1, 0),
        new Vector(-1, -1)
    ];
    constructor(world) {
        this.time = 0;
        this.world = world;
        this.bots = [];
        this.stats = [];
        this.actions = [];
        this.arena = new Arena(world);
        this.arena.generate();
    }
    addBot(bot) {
        this.bots.push(bot);
        this.stats.push(new Status());
    }
    run() {
        while (this.time < 10) {
            this.time++;
            // Request Actions
            for (var i = 0; i < this.bots.length; i++) {
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
            // Evaluate Actions
            if (this.actions.length > 0) {
                this.actions.sort((a, b) => a.time - b.time);
                if (this.actions[0].time <= this.time) {
                    switch (this.actions[0].call.params.command) {
                        case "move":
                            this.resolveMove(this.actions[0]);
                            break;
                        case "scan":
                            this.resolveScan(this.actions[0]);
                            break;
                    }
                    this.actions.shift();
                }
            }
        }
    }
    requestMove(botID, call) {
        var time = this.time + 0;
        this.actions.push(new Action(botID, call, time));
    }
    requestScan(botID, call) {
        var time = this.time + 0;
        this.actions.push(new Action(botID, call, time));
    }
    resolveMove(action) {
        var destination = this.stats[action.botID].pos.add(this.#direction[action.call.params.direction]);
        if (this.arena.getTileSpeed(destination) > 0) {
            this.stats[action.botID].pos = destination;
        }
    }
    resolveScan(action) {
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, 5);
    }
}

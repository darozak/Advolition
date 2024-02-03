"use strict";
class Game {
    time;
    world;
    arena;
    actions;
    bots;
    stats;
    paper = new Paper();
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
        this.stats.push(new Status(this.world));
    }
    run() {
        // Cycle through the game loop until an end-game condition is met.
        while (this.time < 10) {
            console.log(structuredClone(this.actions));
            // Increment game time
            this.time++;
            // Evaluate bots that don't have active actions
            for (var i = 0; i < this.bots.length; i++) {
                if (!this.actions.some(d => d.botID == i)) {
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
            if (this.actions.length > 0) {
                this.actions.sort((a, b) => a.time - b.time);
                while (this.actions[0].time <= this.time) {
                    switch (this.actions[0].call.params.command) {
                        case "move":
                            this.resolveMove(this.actions[0]);
                            break;
                        case "scan":
                            this.resolveScan(this.actions[0]);
                            this.renderArena(0);
                            break;
                    }
                    this.actions.shift();
                    if (this.actions.length == 0)
                        break;
                }
            }
        }
    }
    requestMove(botID, call) {
        var time = this.time + 0;
        this.actions.push(new Action(botID, call, time));
    }
    renderArena(robotID) {
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                const tileID = this.stats[robotID].scan.tiles[i][j];
                if (tileID >= 0) {
                    this.paper.drawTile(this.world.tiles[tileID].sprite, new Vector(i, j), this.stats[robotID].scan.visible[i][j]);
                }
            }
        }
        this.paper.drawTile(this.stats[robotID].sprite, this.stats[robotID].pos, 1);
    }
    requestScan(botID, call) {
        var time = this.time + 4;
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

"use strict";
class Game {
    gameTime;
    world;
    arena;
    actions;
    bots;
    stats;
    paper;
    sysTime = new Date();
    constructor(world) {
        this.gameTime = 0;
        this.world = world;
        this.bots = [];
        this.stats = [];
        this.actions = [];
        this.arena = new Arena(world);
        this.arena.generate();
        this.paper = new Paper();
    }
    addBot(bot, name) {
        this.bots.push(bot);
        this.stats.push(new Status(this.world, name));
        let robotID = this.stats.length - 1;
        this.stats[robotID].pos = this.world.players[robotID].entrance;
        this.stats[robotID].sprite = this.world.players[robotID].sprite;
    }
    run() {
        // Increment game time
        this.gameTime++;
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
            while (this.actions[0].time <= this.gameTime) {
                switch (this.actions[0].call.params.command) {
                    case "move":
                        this.resolveMove(this.actions[0]);
                        break;
                    case "scan":
                        this.resolveScan(this.actions[0]);
                        break;
                }
                this.actions.shift();
                if (this.actions.length == 0)
                    break;
            }
        }
        this.paper.erasePaper();
        for (var i = 0; i < this.stats.length; i++) {
            this.renderArena(i);
        }
    }
    wait(ms) {
        var start = Date.now(), now = start;
        while (now - start < ms) {
            now = Date.now();
        }
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
    requestMove(botID, call) {
        var time = this.gameTime + 2;
        this.actions.push(new Action(botID, call, time));
    }
    requestScan(botID, call) {
        var time = this.gameTime + 2;
        this.actions.push(new Action(botID, call, time));
    }
    resolveMove(action) {
        var destination = this.stats[action.botID].pos.getPathTo(action.call.params.coord)[0];
        if (this.arena.getTileSpeed(destination) > 0) {
            this.stats[action.botID].pos = destination;
        }
    }
    resolveScan(action) {
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, 5);
    }
}

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
    powerColor = [];
    coreColor = [];
    scannerColor = [];
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
        let robotID = this.bots.length - 1;
        this.stats.push(new Status(this.world, robotID, name));
        this.arena.robots[this.stats[robotID].pos.x][this.stats[robotID].pos.y] = robotID;
        this.powerColor.push(new RampedArray([80, 80, 80], [51, 110, 156], 6));
        this.coreColor.push(new RampedArray([80, 80, 80], [51, 110, 156], 6));
        this.scannerColor.push(new RampedArray([80, 80, 80], [51, 110, 156], 6));
    }
    run() {
        // Increment game time
        this.gameTime++;
        // Every ten frames, evaluate the bots that don't have active actions
        if (this.gameTime % 10 == 0) {
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
            // Then resolve and remove any actions that are occuring now.
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
        }
        // Every frame, redraw the game window.
        this.paper.erasePaper();
        for (var i = 0; i < this.stats.length; i++) {
            this.displayRobotStats(i);
        }
    }
    displayRobotStats(robotID) {
        var spriteWidth = 10;
        var mapRadius = 7;
        var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
        var leftMapFrame = 10 + robotID * (mapFrameSize + 10);
        var topMapFrame = 10;
        var centerTextFrame = mapFrameSize / 2 + leftMapFrame;
        var topTextFrame = topMapFrame + mapFrameSize + 20;
        var lineSpacing = 20;
        var x0 = this.stats[robotID].pos.x - mapRadius;
        var y0 = this.stats[robotID].pos.y - mapRadius;
        var x1 = this.stats[robotID].pos.x + mapRadius;
        var y1 = this.stats[robotID].pos.y + mapRadius;
        for (var i = x0; i < x1; i++) {
            for (var j = y0; j < y1; j++) {
                var tileScanID = -1;
                var robotScanID = -1;
                if (i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                    tileScanID = this.stats[robotID].scan.tiles[i][j];
                    robotScanID = this.stats[robotID].scan.robots[i][j];
                }
                // Draw tile.
                if (tileScanID >= 0) {
                    this.paper.drawTile(leftMapFrame, topMapFrame, this.world.tiles[tileScanID].sprite, new Vector(i - x0, j - y0), this.stats[robotID].scan.visible[i][j], false);
                }
                // Draw robot.
                if (robotScanID >= 0) {
                    this.paper.drawTile(leftMapFrame, topMapFrame, this.stats[robotScanID].model.sprite, new Vector(i - x0, j - y0), this.stats[robotID].scan.visible[i][j], false);
                }
            }
        }
        // Draw self in center of map.
        this.paper.drawTile(leftMapFrame, topMapFrame, this.stats[robotID].model.sprite, new Vector(mapRadius, mapRadius), 1, true);
        // Draw a frame around the map.
        this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);
        // Display text
        let statRGB = [180, 180, 180];
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.stats[robotID].name, statRGB);
        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Model', this.stats[robotID].model.name, statRGB);
        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.stats[robotID].pos.print(), statRGB);
        topTextFrame += lineSpacing;
        let hps = this.stats[robotID].currentHps + '/' + this.stats[robotID].model.maxHps;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'HPS', hps, statRGB);
        topTextFrame += lineSpacing;
        let power = this.stats[robotID].currentPower + '/' + this.stats[robotID].model.maxPower;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', power, this.powerColor[robotID].currentValue());
        // List equipped equipment
        topTextFrame += 30;
        this.paper.drawListItem(centerTextFrame, topTextFrame, 'Equipped', [180, 180, 180, 100]);
        topTextFrame += lineSpacing;
        this.paper.drawListItem(centerTextFrame, topTextFrame, this.stats[robotID].scanner.name, this.scannerColor[robotID].currentValue());
        topTextFrame += lineSpacing;
        this.paper.drawListItem(centerTextFrame, topTextFrame, this.stats[robotID].core.name, this.coreColor[robotID].currentValue());
    }
    updateRobotPositions() {
        // Clear grid
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                this.arena.robots[i][j] = -1;
            }
        }
        // Add robots
        for (var i = 0; i < this.stats.length; i++) {
            this.arena.robots[this.stats[i].pos.x][this.stats[i].pos.y] = i;
        }
    }
    requestMove(botID, call) {
        // Reduce power.
        this.stats[botID].currentPower -= this.stats[botID].core.power(call.params.power);
        // Set time delay.
        let delay = this.stats[botID].core.speed(call.params.power);
        this.actions.push(new Action(botID, call, delay + this.gameTime));
        this.coreColor[botID].rampUp();
        this.powerColor[botID].rampUp();
    }
    requestScan(botID, call) {
        this.stats[botID].currentPower -= this.stats[botID].scanner.power(call.params.power);
        call.params.range = this.stats[botID].scanner.range(call.params.power);
        let delay = this.stats[botID].core.speed(call.params.power);
        this.actions.push(new Action(botID, call, delay));
        this.scannerColor[botID].rampUp();
        this.powerColor[botID].rampUp();
    }
    resolveMove(action) {
        var destination = this.stats[action.botID].pos.getPathTo(action.call.params.coord)[0];
        if (this.arena.getTileSpeed(destination) > 0) {
            // Change position in arena.
            this.arena.robots[this.stats[action.botID].pos.x][this.stats[action.botID].pos.y] = -1;
            this.arena.robots[destination.x][destination.y] = action.botID;
            // Change position in stats.
            this.stats[action.botID].pos = destination;
        }
        else {
            // Take damage if you run into something.
            // this.stats[action.botID].currentHps -= 2;
        }
        this.coreColor[action.botID].rampDown();
        this.powerColor[action.botID].rampDown();
    }
    resolveScan(action) {
        let range = this.stats[action.botID].scanner.range(action.call.params.power);
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, range);
        this.scannerColor[action.botID].rampDown();
        this.powerColor[action.botID].rampDown();
    }
}

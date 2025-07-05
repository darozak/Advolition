"use strict";
// import { Arena } from "./arena";
// Start simplifying the game (241205).
class Game {
    gameTime;
    world;
    arena;
    events = [];
    programs = [];
    robotData = [];
    scanData = [];
    paper;
    sysTime = new Date();
    powerColor = [];
    hpsColor = [];
    chassisColor = [];
    coreColor = [];
    scannerColor = [];
    batteryColor = [];
    eventLog = document.getElementById("myTextarea");
    constructor(world, duration) {
        this.gameTime = duration;
        this.world = world;
        this.arena = new Arena(this.world, this.robotData);
        this.arena.generateMap();
        this.paper = new Paper(14);
    }
    addRobot(robot, name, isDisplayed) {
        this.programs.push(robot);
        let robotID = this.programs.length - 1;
        this.robotData.push(new RobotData(this.world, robotID, name, isDisplayed));
        this.scanData.push(new ScanData(this.world, this.robotData[robotID]));
        this.arena.robotMap[this.robotData[robotID].pos.x][this.robotData[robotID].pos.y] = robotID;
        // Locate robot
        this.robotData[robotID].pos = this.arena.placeRobot();
        // Equip items
        this.equipItems(this.robotData[robotID]);
        this.powerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.hpsColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.chassisColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.coreColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.scannerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.batteryColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
    }
    run() {
        if (this.gameTime > 0) {
            // Decrement game time
            this.gameTime--;
            for (var i = 0; i < this.programs.length; i++) {
                // If the robot is still alive and isn't doing anything.
                if (this.robotData[i].isAlive && !this.events.some(d => d.robotID == i)) {
                    var action = new Action();
                    // Make sure the robot's personal data is up to date in scanData.
                    this.scanData[i].robots[i] = structuredClone(this.robotData[i]);
                    this.scanData[i].robots[i].lastScan = this.gameTime;
                    this.scanData[i].gameTime = this.gameTime;
                    // Let the robot run it's code.
                    action = this.programs[i].run(structuredClone(this.scanData[i]));
                    if (action) {
                        switch (action.command) {
                            case "attack":
                                this.requestAttack(i, action);
                                break;
                            case "drop":
                                this.requestDrop(i, action);
                                break;
                            case "take":
                                this.requestTake(i, action);
                                break;
                            case "activate":
                                this.requestEquip(i, action);
                                break;
                            case "inactivate":
                                this.requestUnequip(i, action);
                                break;
                            case "move":
                                this.requestMove(i, action);
                                break;
                            case "say":
                                this.requestSay(i, action);
                                break;
                            case "scan":
                                this.requestScan(i, action);
                                break;
                        }
                    }
                }
            }
            // Then resolve and remove any actions that are occuring now.
            if (this.events.length > 0) {
                // Sort the events in reverse chronological order.
                // this.events.sort((a,b) => a.duration - b.duration);
                this.events.sort((a, b) => b.duration - a.duration);
                // Evaluate any events that should have occurred by now.
                while (this.events[0].duration >= this.gameTime) {
                    switch (this.events[0].action.command) {
                        case "attack":
                            this.resolveAttack(this.events[0]);
                            break;
                        case "drop":
                            this.resolveDrop(this.events[0]);
                            break;
                        case "take":
                            this.resolveTake(this.events[0]);
                            break;
                        case "activate":
                            this.resolveEquip(this.events[0]);
                            break;
                        case "inactivate":
                            this.resolveUnequip(this.events[0]);
                            break;
                        case "move":
                            this.resolveMove(this.events[0]);
                            break;
                        case "say":
                            this.resolveSay(this.events[0]);
                        case "scan":
                            this.resolveScan(this.events[0]);
                            break;
                    }
                    // Remove the processed event break if this was the last event.
                    this.events.shift();
                    if (this.events.length == 0)
                        break;
                }
            }
            // Every frame, redraw the game window.
            this.paper.erasePaper();
            for (var i = 0; i < this.robotData.length; i++) {
                this.displayRobotStats(i);
            }
        }
    }
    displayRobotStats(robotID) {
        if (this.robotData[robotID].isDisplayed) {
            var spriteWidth = 10;
            var mapRadius = 7;
            var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
            var attributeDisplayWidth = 190;
            var robotDisplayWidth = mapFrameSize + attributeDisplayWidth;
            var leftDisplayFrame = 10 - (robotDisplayWidth + 10);
            for (var i = 0; i <= robotID; i++) {
                if (this.robotData[i].isDisplayed)
                    leftDisplayFrame += (robotDisplayWidth + 10);
            }
            var topDisplayFrame = 35;
            var lineSpacing = 15;
            var x0 = this.robotData[robotID].pos.x - mapRadius;
            var y0 = this.robotData[robotID].pos.y - mapRadius;
            var x1 = this.robotData[robotID].pos.x + mapRadius;
            var y1 = this.robotData[robotID].pos.y + mapRadius;
            // Display text
            let statRGB = [180, 180, 180];
            let red = [255, 0, 0];
            // Display stats to left of map.
            let centerTextFrame = leftDisplayFrame + 120;
            let topTextFrame = topDisplayFrame + 10;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot ID', robotID, statRGB, true);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Game Time', this.gameTime, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Worth', this.robotData[robotID].stats.worth, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Bulk', this.robotData[robotID].stats.bulk, statRGB, false);
            // topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'MaxCarry', this.robotData[robotID].stats.maxCarry, statRGB, false);
            // topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'MaxEquip', this.robotData[robotID].stats.maxEquip, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'X Position', this.robotData[robotID].pos.x, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Y Position', this.robotData[robotID].pos.y, statRGB, false);
            // topTextFrame += lineSpacing * 0.5; 
            // let power: string = this.robotData[robotID].stats.generatorPower + '/' + this.robotData[robotID].stats.batteryCapacity;
            // topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', this.robotData[robotID].stats.generatorPower, this.powerColor[robotID].value(), false);
            // Display attributes
            topTextFrame += lineSpacing * 0.5;
            // topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Cost', this.robotData[robotID].stats.moveCost, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Time', this.robotData[robotID].stats.moveTime, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Cost', this.robotData[robotID].stats.scanCost, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Time', this.robotData[robotID].stats.scanTime, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Range', this.robotData[robotID].stats.scanRange, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Attack Cost', this.robotData[robotID].stats.attackCost, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Attack Time', this.robotData[robotID].stats.attackTime, statRGB, false);
            for (var i = 0; i < this.robotData[robotID].stats.elements.length; i++) {
                let attack = this.robotData[robotID].stats.attack[i];
                let element = this.robotData[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Attack", attack, this.hpsColor[robotID].value(), false);
            }
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Shield Cost', this.robotData[robotID].stats.shieldCost, statRGB, false);
            for (var i = 0; i < this.robotData[robotID].stats.elements.length; i++) {
                let shield = this.robotData[robotID].stats.shield[i];
                let element = this.robotData[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Shield", shield, this.hpsColor[robotID].value(), false);
            }
            for (var i = 0; i < this.robotData[robotID].stats.elements.length; i++) {
                let armor = this.robotData[robotID].stats.armor[i];
                let element = this.robotData[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Armor", armor, this.hpsColor[robotID].value(), false);
            }
            // Print log.
            topTextFrame += lineSpacing * 2;
            this.paper.printLog(this.robotData[robotID], leftDisplayFrame + 40, topTextFrame);
            // Display scan view
            let leftMapFrame = leftDisplayFrame + attributeDisplayWidth;
            let topMapFrame = topDisplayFrame;
            // Cycle through all the tiles in the scan display box.
            for (var i = x0; i < x1; i++) {
                for (var j = y0; j < y1; j++) {
                    var tileScanID = -1;
                    var itemScanCount = 0;
                    var robotScanID = -1;
                    var tileAlpha = 0;
                    var robotAlpha = 0;
                    // Grab tile and robot IDs if the plotted region doesn't fall outside of the arena map.
                    if (i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                        tileScanID = this.scanData[robotID].tileMap[i][j];
                        itemScanCount = this.scanData[robotID].itemMap[i][j].length;
                        robotScanID = this.scanData[robotID].robotMap[i][j];
                        // Scan will fade as data ages.
                        let decayRate = 0.02;
                        let decayFloor = 0.3;
                        tileAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].scanTime[i][j]);
                        if (robotScanID >= 0) {
                            robotAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].robots[robotScanID].lastScan);
                        }
                    }
                    // Draw tile.
                    if (tileScanID >= 0) {
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.world.tiles[tileScanID].sprite, new Vector(i - x0, j - y0), tileAlpha, false);
                    }
                    // Draw items.
                    if (itemScanCount > 0) {
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.world.itemSprite, new Vector(i - x0, j - y0), tileAlpha, false);
                    }
                    // Draw robot.
                    if (robotScanID >= 0) {
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.robotData[robotScanID].sprite, new Vector(i - x0, j - y0), robotAlpha, false);
                    }
                }
            }
            // Draw self in center of map.
            if (this.robotData[robotID].isAlive) {
                this.paper.drawTile(leftMapFrame, topMapFrame, this.robotData[robotID].sprite, new Vector(mapRadius, mapRadius), 1, true);
            }
            else {
                topTextFrame = topMapFrame + 20;
                centerTextFrame = mapFrameSize / 2 + leftMapFrame;
                this.paper.drawListItem(centerTextFrame, topTextFrame, 'DEAD', red);
            }
            // Draw a frame around the map.
            this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);
            // Display permissive terrain under map.
            topTextFrame = topDisplayFrame + mapFrameSize + 20;
            centerTextFrame = mapFrameSize / 2 + leftMapFrame;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Passable Terrain', [120, 120, 120]);
            for (var i = 0; i < this.robotData[robotID].stats.permissiveTerrain.length; i++) {
                var color = [180, 180, 180];
                var text;
                topTextFrame += lineSpacing;
                text = this.robotData[robotID].stats.permissiveTerrain[i];
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display inventory under map.
            topTextFrame += lineSpacing * 1.5;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);
            for (var i = 0; i < this.robotData[robotID].items.length; i++) {
                var color = [180, 180, 180];
                var text;
                if (this.robotData[robotID].items[i].isEquipped)
                    color = [51, 110, 156];
                topTextFrame += lineSpacing;
                text = this.robotData[robotID].items[i].name;
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display items on ground under robot.
            let loc = this.robotData[robotID].pos;
            if (this.arena.itemMap[loc.x][loc.y].length > 0) {
                topTextFrame += lineSpacing * 2;
                this.paper.drawListItem(centerTextFrame, topTextFrame, 'On Ground', [120, 120, 120]);
                for (var i = 0; i < this.arena.itemMap[loc.x][loc.y].length; i++) {
                    var color = [180, 180, 180];
                    var text;
                    topTextFrame += lineSpacing;
                    text = this.arena.itemMap[loc.x][loc.y][i].name;
                    this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
                }
            }
        }
    }
    decay(decayRate, decayFloor, elapsedTime) {
        if (decayRate > 1)
            decayRate = 1;
        if (decayFloor > 1)
            decayFloor = 1;
        // f(x) = (1-f)(1 – r)^t
        return (1 - decayFloor) * Math.pow((1 - decayRate), elapsedTime) + decayFloor;
    }
    updateRobotPositions() {
        // Clear grid
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                this.arena.robotMap[i][j] = -1;
            }
        }
        // Add live robots
        for (var i = 0; i < this.robotData.length; i++) {
            if (this.robotData[i].isAlive) {
                this.arena.robotMap[this.robotData[i].pos.x][this.robotData[i].pos.y] = i;
            }
        }
    }
    requestAttack(robotID, action) {
        let powerCost = this.robotData[robotID].stats.attackCost;
        // if(this.drainPower(this.robotData[robotID], powerCost)) {
        let delay = -this.robotData[robotID].stats.attackTime;
        this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        // }
    }
    resolveAttack(action) {
        // Map path to target.
        let path = this.robotData[action.robotID].pos.getPathTo(action.action.target);
        let targetID = -1;
        // Follow path until it hits something.
        for (var i = 0; i < path.length; i++) {
            let tileID = this.arena.tileMap[path[i].x][path[i].y];
            let robotID = this.arena.robotMap[path[i].x][path[i].y];
            // Abort attack if blocked by tile.
            if (!this.world.tiles[tileID].transparent)
                break;
            // Redirect attack if blocked by robot.
            if (robotID >= 0) {
                targetID = robotID;
                break;
            }
        }
        // Inflict damage on robot if there is one in path.
        if (targetID >= 0) {
            let damage = [];
            // let targetRobot = this.robotData[targetID];
            let attacker = this.robotData[action.robotID];
            let defender = this.robotData[targetID];
            // Apply shields if target has enough power to defend itself.
            // if(this.drainPower(this.robotData[targetID], defender.stats.shieldCost)) {
            for (let i = 0; i < defender.stats.elements.length; i++) {
                if (attacker.stats.attack[i] > defender.stats.shield[i])
                    damage.push(attacker.stats.attack[i] - defender.stats.shield[i]);
            }
            // } else {
            //     for(let i = 0; i < defender.stats.elements.length; i ++){
            //         damage.push(attacker.stats.attack[i]);
            //     }
            // }
            // Apply damage to target robot.
            // TASK: Need to integrate takeDamage into code here.
            // this.takeDamage(this.robotData[targetID], damage);
            for (var i = 0; i < defender.items.length; i++) {
                if (defender.items[i].isEquipped) {
                    for (var j = 0; j < defender.stats.elements.length; j++) {
                        if (damage[j] <= defender.items[i].stats.armor[j]) {
                            // Item absorbes all remaining damage.
                            defender.items[i].stats.attack[j] -= damage[j];
                            defender.stats.attack[j] -= damage[j];
                            damage[j] = 0;
                        }
                        else {
                            // Item only absorbes some of the remaining damage.
                            damage[j] -= defender.items[i].stats.attack[j];
                            defender.stats.attack[j] -= defender.items[i].stats.attack[j];
                            defender.items[i].stats.attack[j] = 0;
                        }
                    }
                    if (damage[j] > 0) {
                        // Robot has taken excess damage and is dead.
                        defender.isAlive = false;
                        // Drop items
                        // for(var i = 0; i < robot.items.length; i ++) this.dropItem(robot, i);
                        while (defender.items.length > 0)
                            this.dropItem(defender, 0);
                        // Write to event log.
                        this.appendToLog(defender, this.gameTime, `dies :(`);
                    }
                }
            }
            // Write to event log.
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `attacks ${this.robotData[targetID].name}`);
        }
    }
    requestMove(robotID, action) {
        // let powerCost = this.robotData[robotID].stats.moveCost;
        let destination = this.robotData[robotID].pos.getPathTo(action.target)[0];
        // Is there power for this action?
        // if(this.drainPower(this.robotData[robotID], powerCost)) {
        let delay = -this.robotData[robotID].stats.moveTime;
        delay *= this.robotData[robotID].pos.getDistanceTo(destination);
        // Add action to event que.
        this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        // Animate display elements
        this.coreColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
        // }
    }
    resolveMove(action) {
        var destination = this.robotData[action.robotID].pos.getPathTo(action.action.target)[0];
        var tileID = this.arena.tileMap[destination.x][destination.y];
        var tileName = this.world.tiles[tileID].name;
        let permissiveTerrainIndex = this.robotData[action.robotID].stats.permissiveTerrain.findLastIndex(d => d === tileName);
        // Can the robot move into this tile?
        if (permissiveTerrainIndex >= 0) {
            // Change position in arena.
            this.arena.robotMap[this.robotData[action.robotID].pos.x][this.robotData[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;
            // Change position in stats.
            this.robotData[action.robotID].pos = destination;
            // Write to event log
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `Moves to ${destination.print()}`);
        }
        else {
            // Take damage if you run into something.
            // Wtite to event log.
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `Collides with obstical`);
            // this.takeDamage(this.robotData[action.robotID], 10);
            this.hpsColor[action.robotID].pulse();
            this.chassisColor[action.robotID].pulse();
        }
        // Animate display elements.
        this.coreColor[action.robotID].deactivate();
        this.batteryColor[action.robotID].deactivate();
        this.powerColor[action.robotID].deactivate();
    }
    requestEquip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = -this.robotData[robotID].items[itemID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveEquip(event) {
        // Move item to the top of the list and set to active.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items.unshift(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
            this.robotData[event.robotID].items[0].isEquipped = true;
            // Write to event log.
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `Equips its ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestUnequip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = -this.robotData[robotID].items[itemID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveUnequip(event) {
        // Move item to the bottom of the list and set to inactive.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items[itemID].isEquipped = false;
            this.robotData[event.robotID].items.push(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `Unequips its ${event.action.item}`);
        }
        // Equipe items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestDrop(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = this.robotData[robotID].items[itemID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveDrop(event) {
        let robot = this.robotData[event.robotID];
        let itemID = robot.items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0)
            this.dropItem(robot, itemID);
    }
    requestTake(robotID, action) {
        // Does the robot have enough room in its inventory?
        if (this.robotData[robotID].stats.maxCarry > this.robotData[robotID].items.length) {
            // Does item exist in tile?
            let location = this.robotData[robotID].pos;
            let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === action.item);
            if (itemID >= 0) {
                let delay = -this.robotData[robotID].items[itemID].timeToEquip;
                // Add action to event que.
                this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
            }
        }
    }
    resolveTake(event) {
        // Move item to inventory.
        let location = this.robotData[event.robotID].pos;
        let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items.push(this.arena.itemMap[location.x][location.y].splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `Takes the ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestScan(robotID, call) {
        let powerCost = this.robotData[robotID].stats.scanCost;
        // Is there power for this action?
        // if(this.drainPower(this.robotData[robotID], powerCost)) {
        // Set scan range and delay.
        call.range = this.robotData[robotID].stats.scanRange;
        let delay = -this.robotData[robotID].stats.scanTime;
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, delay + this.gameTime));
        // Animate display elements.
        this.scannerColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
        // }
    }
    resolveScan(event) {
        // Set rane and perform scan.        
        let range = this.robotData[event.robotID].stats.scanRange;
        this.scanData[event.robotID] = this.arena.scan(this.robotData[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        // Write to event log.
        this.appendToLog(this.robotData[event.robotID], this.gameTime, "Scans the area");
        // Animate display elements.
        this.scannerColor[event.robotID].deactivate();
        this.batteryColor[event.robotID].deactivate();
        this.powerColor[event.robotID].deactivate();
    }
    requestSay(robotID, call) {
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, 2 + this.gameTime));
    }
    resolveSay(event) {
        // Write to event log.
        this.appendToLog(this.robotData[event.robotID], this.gameTime, 'Says: ' + event.action.message);
    }
    equipItems(robot) {
        // Unequip any items over the max.
        for (var i = robot.stats.maxEquip; i < robot.items.length; i++) {
            robot.items[i].isEquipped = false;
        }
        // Recompute attributes based on equipped items.
        robot.stats.copy(robot.baseStats);
        for (var i = 0; i < robot.items.length; i++) {
            if (robot.items[i].isEquipped) {
                robot.stats.add(robot.items[i].stats);
            }
        }
    }
    dropItem(robot, itemID) {
        if (robot.items.length > itemID) {
            let location = robot.pos;
            this.appendToLog(robot, this.gameTime, `drops its ${robot.items[itemID].name}`);
            robot.items[itemID].isEquipped = false;
            this.arena.itemMap[location.x][location.y].push(robot.items.splice(itemID, 1)[0]);
            this.equipItems(robot);
        }
    }
    // drainPower(robot: RobotData, amount: number){
    //     for(var i = 0; i < robot.items.length; i ++) {
    //         // Only take power from active items.
    //         if(robot.items[i].isEquipped) {
    //             // Drain required power from item if there is enough.
    //             if(amount <= robot.items[i].stats.generatorPower) {
    //                 robot.items[i].stats.generatorPower -= amount;
    //                 robot.stats.generatorPower -= amount;
    //                 amount = 0;
    //             // Otherwise drain what is available from that item.
    //             } else {
    //                 amount -= robot.items[i].stats.generatorPower;
    //                 robot.stats.generatorPower -= robot.items[i].stats.generatorPower;
    //                 robot.items[i].stats.generatorPower = 0;
    //             }
    //         }
    //     }
    //     // Return true if robot has enough power to complete the action.
    //     return (amount == 0);
    // }
    // addPower(robot: RobotData, amount: number){
    //     for(var i = 0; i < robot.items.length; i ++) {
    //         if(amount + robot.items[i].stats.generatorPower <= robot.items[i].stats.batteryCapacity) {
    //             robot.items[i].stats.generatorPower += amount;
    //             amount = 0;
    //         } else {
    //             amount -= robot.items[i].stats.batteryCapacity - robot.items[i].stats.generatorPower;
    //             robot.items[i].stats.generatorPower = robot.items[i].stats.batteryCapacity;
    //         }
    //     }
    //     return (amount == 0);
    // }
    appendToLog(robot, time, entry) {
        robot.logTime.push(time);
        robot.logEntry.push(entry);
        if (robot.logTime.length > robot.maxLogLength) {
            robot.logTime.shift();
            robot.logEntry.shift();
        }
    }
}

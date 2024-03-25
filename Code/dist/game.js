"use strict";
// import { Arena } from "./arena";
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
        this.paper = new Paper();
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
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.robotData[robotID].name, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Game Time', this.gameTime, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Score', this.robotData[robotID].adjustedStats.value, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.robotData[robotID].pos.print(), statRGB);
            topTextFrame += lineSpacing;
            let hps = this.robotData[robotID].adjustedStats.HPs + '/' + this.robotData[robotID].adjustedStats.maxHPs;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'HPs', hps, this.hpsColor[robotID].value());
            topTextFrame += lineSpacing;
            let power = this.robotData[robotID].adjustedStats.power + '/' + this.robotData[robotID].adjustedStats.maxPower;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', power, this.powerColor[robotID].value());
            // Display attributes
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Power', this.robotData[robotID].adjustedStats.movePower, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Time', this.robotData[robotID].adjustedStats.moveTime, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Power', this.robotData[robotID].adjustedStats.scanPower, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Time', this.robotData[robotID].adjustedStats.scanTime, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Range', this.robotData[robotID].adjustedStats.scanRange, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Offense Power', this.robotData[robotID].adjustedStats.offensePower, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Offense Time', this.robotData[robotID].adjustedStats.offenseTime, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Kinetic Damage', this.robotData[robotID].adjustedStats.kineticDamage, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Thermal Damage', this.robotData[robotID].adjustedStats.thermalDamage, statRGB);
            topTextFrame += lineSpacing * 1.5;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Defense Power', this.robotData[robotID].adjustedStats.defensePower, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Kinetic Defense', this.robotData[robotID].adjustedStats.kineticDefense, statRGB);
            topTextFrame += lineSpacing;
            this.paper.showStatus(centerTextFrame, topTextFrame, 'Thermal Defense', this.robotData[robotID].adjustedStats.thermalDefense, statRGB);
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
            for (var i = 0; i < this.robotData[robotID].adjustedStats.permissiveTerrain.length; i++) {
                var color = [180, 180, 180];
                var text;
                topTextFrame += lineSpacing;
                text = this.robotData[robotID].adjustedStats.permissiveTerrain[i];
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display inventory under map.
            topTextFrame += lineSpacing * 1.5;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);
            for (var i = 0; i < this.robotData[robotID].items.length; i++) {
                var color = [180, 180, 180];
                var text;
                if (this.robotData[robotID].items[i].isActive)
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
        let powerCost = this.robotData[robotID].adjustedStats.offensePower;
        if (this.drainPower(this.robotData[robotID], powerCost)) {
            let delay = -this.robotData[robotID].adjustedStats.offenseTime;
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
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
            let damage = 0;
            let attackerStats = this.robotData[action.robotID].adjustedStats;
            let defenderStats = this.robotData[targetID].adjustedStats;
            // Apply shields if target has enough power to defend itself.
            if (this.drainPower(this.robotData[targetID], defenderStats.defensePower)) {
                if (attackerStats.kineticDamage > defenderStats.kineticDefense)
                    damage += attackerStats.kineticDamage - defenderStats.kineticDefense;
                if (attackerStats.thermalDamage > defenderStats.thermalDefense)
                    damage += (attackerStats.thermalDamage - defenderStats.thermalDefense);
            }
            else {
                damage += attackerStats.kineticDamage + attackerStats.thermalDamage;
            }
            // Apply damage to target robot.
            this.takeDamage(this.robotData[targetID], damage);
            // Write to event log.
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `attacks ${this.robotData[targetID].name}`);
        }
    }
    requestMove(robotID, action) {
        let powerCost = this.robotData[robotID].adjustedStats.movePower;
        let destination = this.robotData[robotID].pos.getPathTo(action.target)[0];
        // Is there power for this action?
        if (this.drainPower(this.robotData[robotID], powerCost)) {
            let delay = -this.robotData[robotID].adjustedStats.moveTime;
            delay *= this.robotData[robotID].pos.getDistanceTo(destination);
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
            // Animate display elements
            this.coreColor[robotID].activate();
            this.batteryColor[robotID].activate();
            this.powerColor[robotID].activate();
        }
    }
    resolveMove(action) {
        var destination = this.robotData[action.robotID].pos.getPathTo(action.action.target)[0];
        var tileID = this.arena.tileMap[destination.x][destination.y];
        var tileName = this.world.tiles[tileID].name;
        let permissiveTerrainIndex = this.robotData[action.robotID].adjustedStats.permissiveTerrain.findLastIndex(d => d === tileName);
        // Can the robot move into this tile?
        if (permissiveTerrainIndex >= 0) {
            // Change position in arena.
            this.arena.robotMap[this.robotData[action.robotID].pos.x][this.robotData[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;
            // Change position in stats.
            this.robotData[action.robotID].pos = destination;
            // Write to event log.
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `moves to ${destination.print()}`);
        }
        else {
            // Take damage if you run into something.
            // Wtite to event log.
            this.appendToLog(this.robotData[action.robotID], this.gameTime, `collides with obstical`);
            this.takeDamage(this.robotData[action.robotID], 10);
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
            let delay = -this.robotData[robotID].items[itemID].timeToActivate;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveEquip(event) {
        // Move item to the top of the list and set to active.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items.unshift(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
            this.robotData[event.robotID].items[0].isActive = true;
            // Write to event log.
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `equips its ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestUnequip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = -this.robotData[robotID].items[itemID].timeToActivate;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveUnequip(event) {
        // Move item to the bottom of the list and set to inactive.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items[itemID].isActive = false;
            this.robotData[event.robotID].items.push(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `unequips its ${event.action.item}`);
        }
        // Equipe items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestDrop(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = this.robotData[robotID].items[itemID].timeToActivate;
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
        if (this.robotData[robotID].adjustedStats.maxCarry > this.robotData[robotID].items.length) {
            // Does item exist in tile?
            let location = this.robotData[robotID].pos;
            let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === action.item);
            if (itemID >= 0) {
                let delay = -this.robotData[robotID].items[itemID].timeToActivate;
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
            this.appendToLog(this.robotData[event.robotID], this.gameTime, `takes the ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestScan(robotID, call) {
        let powerCost = this.robotData[robotID].adjustedStats.scanPower;
        // Is there power for this action?
        if (this.drainPower(this.robotData[robotID], powerCost)) {
            // Set scan range and delay.
            call.range = this.robotData[robotID].adjustedStats.scanRange;
            let delay = -this.robotData[robotID].adjustedStats.scanTime;
            // Add action to event queue.
            this.events.push(new GameEvent(robotID, call, delay + this.gameTime));
            // Animate display elements.
            this.scannerColor[robotID].activate();
            this.batteryColor[robotID].activate();
            this.powerColor[robotID].activate();
        }
    }
    resolveScan(event) {
        // Set rane and perform scan.        
        let range = this.robotData[event.robotID].adjustedStats.scanRange;
        this.scanData[event.robotID] = this.arena.scan(this.robotData[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        // Write to event log.
        this.appendToLog(this.robotData[event.robotID], this.gameTime, "scans the area");
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
        this.appendToLog(this.robotData[event.robotID], this.gameTime, 'says: ' + event.action.message);
    }
    equipItems(robot) {
        // Equip allowable number of items.
        for (var i = 0; i < robot.items.length; i++) {
            robot.items[i].isEquipped = (i <= robot.adjustedStats.maxEquip);
        }
        // Inactivate all unequipped items.
        for (var i = 0; i < robot.items.length; i++) {
            if (!robot.items[i].isEquipped)
                robot.items[i].isActive = false;
        }
        // Recompute attributes based on active items.
        robot.adjustedStats.copy(robot.baseStats);
        // Apply mods from equipped items.
        for (var i = 0; i < robot.items.length; i++) {
            if (robot.items[i].isActive) {
                robot.adjustedStats.add(robot.items[i].effects);
            }
        }
    }
    dropItem(robot, itemID) {
        if (robot.items.length > itemID) {
            let location = robot.pos;
            this.appendToLog(robot, this.gameTime, `drops its ${robot.items[itemID].name}`);
            robot.items[itemID].isActive = false;
            this.arena.itemMap[location.x][location.y].push(robot.items.splice(itemID, 1)[0]);
            this.equipItems(robot);
        }
    }
    takeDamage(robot, damage) {
        for (var i = 0; i < robot.items.length; i++) {
            if (robot.items[i].isActive) {
                if (damage <= robot.items[i].effects.HPs) {
                    // Item absorbes all remaining damage.
                    robot.items[i].effects.HPs -= damage;
                    robot.adjustedStats.HPs -= damage;
                    damage = 0;
                }
                else {
                    // Item only absorbes some of the remaining damage.
                    damage -= robot.items[i].effects.HPs;
                    robot.adjustedStats.HPs -= robot.items[i].effects.HPs;
                    robot.items[i].effects.HPs = 0;
                }
            }
        }
        if (damage > 0) {
            // Robot has taken excess damage and is dead.
            robot.isAlive = false;
            // Drop items
            // for(var i = 0; i < robot.items.length; i ++) this.dropItem(robot, i);
            while (robot.items.length > 0)
                this.dropItem(robot, 0);
            // Write to event log.
            this.appendToLog(robot, this.gameTime, `dies :(`);
        }
    }
    drainPower(robot, amount) {
        for (var i = 0; i < robot.items.length; i++) {
            // Only take power from active items.
            if (robot.items[i].isActive) {
                // Drain required power from item if there is enough.
                if (amount <= robot.items[i].effects.power) {
                    robot.items[i].effects.power -= amount;
                    robot.adjustedStats.power -= amount;
                    amount = 0;
                    // Otherwise drain what is available from that item.
                }
                else {
                    amount -= robot.items[i].effects.power;
                    robot.adjustedStats.power -= robot.items[i].effects.power;
                    robot.items[i].effects.power = 0;
                }
            }
        }
        // Return true if robot has enough power to complete the action.
        return (amount == 0);
    }
    addPower(robot, amount) {
        for (var i = 0; i < robot.items.length; i++) {
            if (amount + robot.items[i].effects.power <= robot.items[i].effects.maxPower) {
                robot.items[i].effects.power += amount;
                amount = 0;
            }
            else {
                amount -= robot.items[i].effects.maxPower - robot.items[i].effects.power;
                robot.items[i].effects.power = robot.items[i].effects.maxPower;
            }
        }
        return (amount == 0);
    }
    appendToLog(robot, time, entry) {
        robot.logTime.push(time);
        robot.logEntry.push(entry);
        if (robot.logTime.length > robot.maxLogLength) {
            robot.logTime.shift();
            robot.logEntry.shift();
        }
    }
}

"use strict";
class Game {
    gameTime;
    world;
    arena;
    events = [];
    programs = [];
    scanData = [];
    paper;
    sysTime = new Date();
    powerColor = [];
    hpsColor = [];
    chassisColor = [];
    coreColor = [];
    scannerColor = [];
    batteryColor = [];
    constructor(world, duration) {
        this.gameTime = duration;
        this.world = world;
        this.arena = new Arena(this.world);
        this.arena.generateMap();
        this.paper = new Paper(14);
    }
    // Uploaded programs should be passed in as a SandboxedBot. A plain Program
    // runs in the page without a sandbox (for built-in robots and tests).
    addRobot(robot, name, isDisplayed) {
        this.programs.push('decide' in robot ? robot : new LocalBot(robot));
        let robotID = this.programs.length - 1;
        this.arena.robots.push(new RobotData(this.world, robotID, name, isDisplayed));
        this.scanData.push(new ScanData(this.world, this.arena.robots[robotID]));
        // Locate robot
        this.arena.robots[robotID].pos = this.arena.placeRobot(robotID);
        // Record robot on map
        this.arena.robotMap[this.arena.robots[robotID].pos.x][this.arena.robots[robotID].pos.y] = robotID;
        // Create nest
        this.arena.robots[robotID].nest.setEqualTo(this.arena.robots[robotID].pos);
        // Equip items
        this.equipItems(this.arena.robots[robotID]);
        this.powerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.hpsColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.chassisColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.coreColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.scannerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.batteryColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
    }
    async run() {
        if (this.gameTime > 0) {
            // Decrement game time
            this.gameTime--;
            // Ask every robot that is alive and not busy for its next action.
            // Programs run in their own sandboxes, so they think in parallel.
            let deciding = [];
            let decisions = [];
            for (var i = 0; i < this.programs.length; i++) {
                if (this.arena.robots[i].isAlive && !this.events.some(d => d.robotID == i)) {
                    // Make sure the robot's personal data is up to date in scanData.
                    this.scanData[i].robots[i] = structuredClone(this.arena.robots[i]);
                    this.scanData[i].robots[i].lastScan = this.gameTime;
                    this.scanData[i].gameTime = this.gameTime;
                    this.scanData[i].robotCount = this.programs.length;
                    deciding.push(i);
                    decisions.push(this.programs[i].decide(this.scanData[i]));
                }
            }
            let results = await Promise.all(decisions);
            for (var k = 0; k < deciding.length; k++) {
                var i = deciding[k];
                {
                    // If the program threw, the robot does nothing this turn
                    // and the error goes in its log.
                    let result = results[k];
                    if (result.error !== undefined) {
                        let entry = result.error.startsWith('Program stopped') ? result.error : `Program error: ${result.error}`;
                        let robot = this.arena.robots[i];
                        if (robot.logEntry[robot.logEntry.length - 1] != entry) {
                            this.appendToLog(robot, this.gameTime, entry);
                            console.error(`${robot.name}: ${result.error}`);
                        }
                    }
                    let action = this.checkAction(i, result.action);
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
                // Sort the events in reverse chronological order. Ties go in random order.
                this.events.sort((a, b) => (b.duration - a.duration) || (a.tieBreak - b.tieBreak));
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
                            break;
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
            for (var i = 0; i < this.arena.robots.length; i++) {
                this.displayRobotStats(i);
            }
            // When time runs out, announce the result.
            if (this.gameTime == 0)
                this.showResult();
        }
    }
    showResult() {
        let robots = this.arena.robots;
        if (robots.length == 0)
            return;
        let scores = robots.map((r, i) => this.arena.getScore(i));
        let best = Math.max(...scores);
        let winners = robots.filter((r, i) => scores[i] == best).map(r => r.name);
        let text = winners.length == 1
            ? `GAME OVER: ${winners[0]} wins with a score of ${best}`
            : `GAME OVER: Tie between ${winners.join(' and ')} with a score of ${best}`;
        this.paper.drawBanner(10, 22, text, [255, 215, 0]);
        console.log(text);
    }
    displayRobotStats(robotID) {
        if (this.arena.robots[robotID].isDisplayed) {
            var spriteWidth = 10;
            var mapRadius = 7;
            var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
            var attributeDisplayWidth = 190;
            var robotDisplayWidth = mapFrameSize + attributeDisplayWidth;
            var leftDisplayFrame = 10 - (robotDisplayWidth + 10);
            for (var i = 0; i <= robotID; i++) {
                if (this.arena.robots[i].isDisplayed)
                    leftDisplayFrame += (robotDisplayWidth + 10);
            }
            var topDisplayFrame = 35;
            var lineSpacing = 15;
            var x0 = this.arena.robots[robotID].pos.x - mapRadius;
            var y0 = this.arena.robots[robotID].pos.y - mapRadius;
            var x1 = this.arena.robots[robotID].pos.x + mapRadius;
            var y1 = this.arena.robots[robotID].pos.y + mapRadius;
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
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Score', this.arena.getScore(robotID), statRGB, true);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Worth', this.arena.robots[robotID].stats.worth, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Bulk', this.arena.robots[robotID].stats.bulk, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Action Time', this.arena.robots[robotID].stats.getActionTime(), statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'X Home', this.arena.robots[robotID].nest.x, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Y Home', this.arena.robots[robotID].nest.y, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'X Position', this.arena.robots[robotID].pos.x, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Y Position', this.arena.robots[robotID].pos.y, statRGB, false);
            // Display attributes
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Range', this.arena.robots[robotID].stats.scanRange, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            for (var i = 0; i < this.arena.robots[robotID].stats.elements.length; i++) {
                let attack = this.arena.robots[robotID].stats.attack[i];
                let element = this.arena.robots[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Attack", attack, this.hpsColor[robotID].value(), false);
            }
            topTextFrame += lineSpacing * 0.5;
            for (var i = 0; i < this.arena.robots[robotID].stats.elements.length; i++) {
                let shield = this.arena.robots[robotID].stats.shield[i];
                let element = this.arena.robots[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Shield", shield, this.hpsColor[robotID].value(), false);
            }
            for (var i = 0; i < this.arena.robots[robotID].stats.elements.length; i++) {
                let armor = this.arena.robots[robotID].stats.armor[i];
                let element = this.arena.robots[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Armor", armor, this.hpsColor[robotID].value(), false);
            }
            // Print log.
            topTextFrame += lineSpacing * 2;
            this.paper.printLog(this.arena.robots[robotID], leftDisplayFrame + 40, topTextFrame);
            // Display scan view
            let leftMapFrame = leftDisplayFrame + attributeDisplayWidth;
            let topMapFrame = topDisplayFrame;
            // Cycle through all the tiles in the scan display box.
            for (var i = x0; i <= x1; i++) {
                for (var j = y0; j <= y1; j++) {
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
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.arena.robots[robotScanID].sprite, new Vector(i - x0, j - y0), robotAlpha, false);
                    }
                }
            }
            // Draw self in center of map.
            if (this.arena.robots[robotID].isAlive) {
                this.paper.drawTile(leftMapFrame, topMapFrame, this.arena.robots[robotID].sprite, new Vector(mapRadius, mapRadius), 1, true);
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
            for (var i = 0; i < this.arena.robots[robotID].stats.permissiveTerrain.length; i++) {
                var color = [180, 180, 180];
                var text;
                topTextFrame += lineSpacing;
                text = this.arena.robots[robotID].stats.permissiveTerrain[i];
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display inventory under map.
            topTextFrame += lineSpacing * 1.5;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);
            for (var i = 0; i < this.arena.robots[robotID].items.length; i++) {
                var color = [180, 180, 180];
                var text;
                if (this.arena.robots[robotID].items[i].isEquipped)
                    color = [51, 110, 156];
                topTextFrame += lineSpacing;
                text = this.arena.robots[robotID].items[i].name;
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display items on ground under robot.
            let loc = this.arena.robots[robotID].pos;
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
        for (var i = 0; i < this.arena.robots.length; i++) {
            if (this.arena.robots[i].isAlive) {
                this.arena.robotMap[this.arena.robots[i].pos.x][this.arena.robots[i].pos.y] = i;
            }
        }
    }
    /**
     * Turns whatever a program returned into a safe action, or null. Programs
     * run in a sandbox, so their actions arrive as plain data and can't be trusted.
     */
    checkAction(robotID, raw) {
        if (!raw || typeof raw !== 'object' || typeof raw.command !== 'string')
            return null;
        let action = new Action();
        action.command = raw.command;
        action.item = typeof raw.item === 'string' ? raw.item : '';
        action.message = typeof raw.message === 'string' ? raw.message.slice(0, 200) : '';
        if (action.command == 'move' || action.command == 'attack') {
            if (!raw.target)
                return null;
            let x = Number(raw.target.x), y = Number(raw.target.y);
            if (!Number.isFinite(x) || !Number.isFinite(y))
                return null;
            // Bring very distant targets closer along the same line, so paths
            // stay short. Aiming past a target still works.
            let pos = this.arena.robots[robotID].pos;
            let limit = 2 * Math.max(this.world.size.x, this.world.size.y);
            let dx = x - pos.x, dy = y - pos.y;
            let reach = Math.max(Math.abs(dx), Math.abs(dy));
            if (reach > limit) {
                dx *= limit / reach;
                dy *= limit / reach;
            }
            action.target = new Vector(Math.round(pos.x + dx), Math.round(pos.y + dy));
        }
        return action;
    }
    // Stops every robot's program.
    stop() {
        this.programs.forEach(program => program.stop());
    }
    requestAttack(robotID, action) {
        let delay = this.arena.robots[robotID].stats.getActionTime();
        this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
    }
    resolveAttack(action) {
        // Map path to target.
        let path = this.arena.robots[action.robotID].pos.getPathTo(action.action.target);
        let targetID = -1;
        // Follow path until it hits something.
        for (var i = 0; i < path.length; i++) {
            // Stop at the edge of the map.
            if (path[i].x < 0 || path[i].x >= this.world.size.x || path[i].y < 0 || path[i].y >= this.world.size.y)
                break;
            let tileID = this.arena.tileMap[path[i].x][path[i].y];
            let robotID = this.arena.robotMap[path[i].x][path[i].y];
            // Hit the first robot in the path (other than the attacker). This is
            // checked before the tile, so a robot standing in a doorway can be hit.
            if (robotID >= 0 && robotID != action.robotID) {
                targetID = robotID;
                break;
            }
            // Otherwise stop if the tile blocks the shot.
            if (!this.world.tiles[tileID].transparent)
                break;
        }
        // Inflict damage on robot if there is one in path.
        if (targetID >= 0) {
            let attacker = this.arena.robots[action.robotID];
            let defender = this.arena.robots[targetID];
            // Write to event log.
            this.appendToLog(attacker, this.gameTime, `attacks ${defender.name}`);
            // Shields block part of each element's attack.
            let damage = [];
            for (let i = 0; i < defender.stats.elements.length; i++) {
                damage.push(Math.max(0, attacker.stats.attack[i] - defender.stats.shield[i]));
            }
            // Equipped armor absorbs the rest and wears down as it does.
            for (let i = 0; i < defender.items.length; i++) {
                let item = defender.items[i];
                if (!item.isEquipped)
                    continue;
                for (let j = 0; j < defender.stats.elements.length; j++) {
                    let absorbed = Math.min(damage[j], item.stats.armor[j]);
                    item.stats.armor[j] -= absorbed;
                    damage[j] -= absorbed;
                }
            }
            // Recompute the defender's stats from its worn-down items.
            this.equipItems(defender);
            // Any damage the armor couldn't absorb kills the robot.
            if (damage.some(d => d > 0)) {
                defender.isAlive = false;
                // Drop items and clear the robot from the map.
                while (defender.items.length > 0)
                    this.dropItem(defender, 0);
                this.arena.robotMap[defender.pos.x][defender.pos.y] = -1;
                // Cancel any actions it still had queued.
                this.events = this.events.filter(e => e.robotID != targetID);
                // Write to event log.
                this.appendToLog(defender, this.gameTime, `dies :(`);
            }
        }
    }
    requestMove(robotID, action) {
        let destination = this.arena.robots[robotID].pos.getPathTo(action.target)[0];
        let delay = this.arena.robots[robotID].stats.getActionTime();
        delay *= this.arena.robots[robotID].pos.getDistanceTo(destination);
        // Add action to event que.
        this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        // Animate display elements
        this.coreColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
    }
    resolveMove(action) {
        var destination = this.arena.robots[action.robotID].pos.getPathTo(action.action.target)[0];
        var tileID = this.arena.tileMap[destination.x][destination.y];
        var tileName = this.world.tiles[tileID].name;
        let permissiveTerrainIndex = this.arena.robots[action.robotID].stats.permissiveTerrain.findLastIndex(d => d === tileName);
        // Is another robot already standing there?
        let occupantID = this.arena.robotMap[destination.x][destination.y];
        let isOccupied = occupantID >= 0 && occupantID != action.robotID;
        // Can the robot move into this tile?
        if (permissiveTerrainIndex >= 0 && !isOccupied) {
            // Change position in arena.
            this.arena.robotMap[this.arena.robots[action.robotID].pos.x][this.arena.robots[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;
            // Change position in stats.
            this.arena.robots[action.robotID].pos = destination;
            // Write to event log
            this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Moves to ${destination.print()}`);
        }
        else {
            // Take damage if you run into something.
            // Write to event log.
            if (isOccupied) {
                this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Bumps into ${this.arena.robots[occupantID].name}`);
            }
            else {
                this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Collides with obstacle`);
            }
            // this.takeDamage(this.arena.robots[action.robotID], 10);
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
        let itemID = this.arena.robots[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
    }
    resolveEquip(event) {
        // Move item to the top of the list and set to active.
        let itemID = this.arena.robots[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items.unshift(this.arena.robots[event.robotID].items.splice(itemID, 1)[0]);
            this.arena.robots[event.robotID].items[0].isEquipped = true;
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Equips its ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestUnequip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.arena.robots[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
    }
    resolveUnequip(event) {
        // Move item to the bottom of the list and set to inactive.
        let itemID = this.arena.robots[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items[itemID].isEquipped = false;
            this.arena.robots[event.robotID].items.push(this.arena.robots[event.robotID].items.splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Unequips its ${event.action.item}`);
        }
        // Equipe items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestDrop(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.arena.robots[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
    }
    resolveDrop(event) {
        let robot = this.arena.robots[event.robotID];
        let itemID = robot.items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0)
            this.dropItem(robot, itemID);
    }
    requestTake(robotID, action) {
        // Does the robot have enough room in its inventory?
        if (this.arena.robots[robotID].stats.maxCarry > this.arena.robots[robotID].items.length) {
            // Does item exist in tile?
            let location = this.arena.robots[robotID].pos;
            let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === action.item);
            if (itemID >= 0) {
                let delay = this.arena.robots[robotID].stats.getActionTime();
                // Add action to event que.
                this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
            }
        }
    }
    resolveTake(event) {
        // Move item to inventory.
        let location = this.arena.robots[event.robotID].pos;
        let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items.push(this.arena.itemMap[location.x][location.y].splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Takes the ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestScan(robotID, call) {
        // Set scan range and delay.
        call.range = this.arena.robots[robotID].stats.scanRange;
        let delay = this.arena.robots[robotID].stats.getActionTime();
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, this.gameTime - delay));
        // Animate display elements.
        this.scannerColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
    }
    resolveScan(event) {
        // Set rane and perform scan.        
        let range = this.arena.robots[event.robotID].stats.scanRange;
        this.scanData[event.robotID] = this.arena.scan(this.arena.robots[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        // Write to event log.
        this.appendToLog(this.arena.robots[event.robotID], this.gameTime, "Scans the area");
        // Animate display elements.
        this.scannerColor[event.robotID].deactivate();
        this.batteryColor[event.robotID].deactivate();
        this.powerColor[event.robotID].deactivate();
    }
    requestSay(robotID, call) {
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, this.gameTime));
    }
    resolveSay(event) {
        // Write to event log.
        this.appendToLog(this.arena.robots[event.robotID], this.gameTime, 'Says: ' + event.action.message);
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
            else {
                // Carried items still count toward worth and bulk.
                robot.stats.worth += robot.items[i].stats.worth;
                robot.stats.bulk += robot.items[i].stats.bulk;
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
    appendToLog(robot, time, entry) {
        robot.logTime.push(time);
        robot.logEntry.push(entry);
        if (robot.logTime.length > robot.maxLogLength) {
            robot.logTime.shift();
            robot.logEntry.shift();
        }
    }
}

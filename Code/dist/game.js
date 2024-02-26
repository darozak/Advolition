"use strict";
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
    constructor(world) {
        this.gameTime = 0;
        this.world = world;
        this.arena = new Arena(this.world, this.robotData);
        this.arena.generate();
        this.paper = new Paper();
    }
    addRobot(robot, name) {
        this.programs.push(robot);
        let robotID = this.programs.length - 1;
        this.robotData.push(new RobotData(this.world, robotID, name));
        this.scanData.push(new ScanData(this.world, this.robotData[robotID]));
        this.arena.robotMap[this.robotData[robotID].pos.x][this.robotData[robotID].pos.y] = robotID;
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
        // Increment game time
        this.gameTime++;
        for (var i = 0; i < this.programs.length; i++) {
            // If the robot is still alive and isn't doing anything.
            if (this.robotData[i].adjustedStats.HPs > 0 && !this.events.some(d => d.robotID == i)) {
                var action = new Action();
                // Make sure the robot's personal data is up to date in scanData.
                this.scanData[i].robots[i] = structuredClone(this.robotData[i]);
                this.scanData[i].robots[i].lastScan = this.gameTime;
                // Let the robot run it's code.
                action = this.programs[i].run(i, structuredClone(this.scanData[i]), action);
                if (action) {
                    switch (action.command) {
                        case "trigger":
                            this.requestTrigger(i, action);
                            break;
                        case "drop":
                            this.requestDrop(i, action);
                            break;
                        case "activate":
                            this.requestActivate(i, action);
                            break;
                        case "inactivate":
                            this.requestInactivate(i, action);
                            break;
                        case "move":
                            this.requestMove(i, action);
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
            // Sort the events in chronological order.
            this.events.sort((a, b) => a.duration - b.duration);
            // Evaluate any events that should have occurred by now.
            while (this.events[0].duration <= this.gameTime) {
                switch (this.events[0].action.command) {
                    case "trigger":
                        this.resolveTrigger(this.events[0]);
                        break;
                    case "drop":
                        this.resolveDrop(this.events[0]);
                        break;
                    case "activate":
                        this.resolveActivate(this.events[0]);
                        break;
                    case "inactivate":
                        this.resolveInactivate(this.events[0]);
                        break;
                    case "move":
                        this.resolveMove(this.events[0]);
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
        for (var i = 0; i < this.robotData.length; i++) {
            this.displayRobotStats(i);
        }
    }
    displayRobotStats(robotID) {
        var spriteWidth = 10;
        var mapRadius = 7;
        var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
        var attributeDisplayWidth = 200;
        var robotDisplayWidth = mapFrameSize + attributeDisplayWidth;
        var leftMapFrame = 10 + robotID * (robotDisplayWidth + 10);
        var topMapFrame = 10;
        var centerTextFrame = mapFrameSize / 2 + leftMapFrame;
        var topTextFrame = topMapFrame + mapFrameSize + 20;
        var lineSpacing = 15;
        var x0 = this.robotData[robotID].pos.x - mapRadius;
        var y0 = this.robotData[robotID].pos.y - mapRadius;
        var x1 = this.robotData[robotID].pos.x + mapRadius;
        var y1 = this.robotData[robotID].pos.y + mapRadius;
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
        this.paper.drawTile(leftMapFrame, topMapFrame, this.robotData[robotID].sprite, new Vector(mapRadius, mapRadius), 1, true);
        // Draw a frame around the map.
        this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);
        // Display text
        let statRGB = [180, 180, 180];
        // Display inventory under map.
        this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);
        for (var i = 0; i < this.robotData[robotID].items.length; i++) {
            var color = [180, 180, 180];
            var text;
            if (this.robotData[robotID].items[i].isActive)
                color = [51, 110, 156];
            topTextFrame += lineSpacing;
            text = this.robotData[robotID].items[i].name + ' (' + this.robotData[robotID].items[i].slot + ')';
            this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
        }
        // Display stats to right of map.
        centerTextFrame = leftMapFrame + mapFrameSize + 120;
        topTextFrame = 20;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.robotData[robotID].name, statRGB);
        topTextFrame += lineSpacing * 1.5;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.robotData[robotID].pos.print(), statRGB);
        topTextFrame += lineSpacing;
        let hps = this.robotData[robotID].adjustedStats.HPs + '/' + this.robotData[robotID].adjustedStats.maxHPs;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'HPs', hps, this.hpsColor[robotID].value());
        topTextFrame += lineSpacing;
        let power = this.robotData[robotID].adjustedStats.power + '/' + this.robotData[robotID].adjustedStats.maxPower;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', power, this.powerColor[robotID].value());
        // Display slots
        topTextFrame += lineSpacing * 0.5;
        for (var i = 0; i < this.robotData[robotID].slots.length; i++) {
            topTextFrame += lineSpacing;
            let slotName = this.robotData[robotID].slots[i].name;
            let slotCount = this.robotData[robotID].slots[i].count;
            if (slotCount > 0) {
                this.paper.showStatus(centerTextFrame, topTextFrame, slotName, slotCount, [180, 180, 180]);
            }
        }
        // Display attributes
        topTextFrame += lineSpacing * 1.5;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Power', this.robotData[robotID].adjustedStats.movePower, statRGB);
        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Move Time', this.robotData[robotID].adjustedStats.moveTime, statRGB);
        topTextFrame += lineSpacing * 1.5;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Trigger Power', this.robotData[robotID].adjustedStats.triggerPower, statRGB);
        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Trigger Time', this.robotData[robotID].adjustedStats.triggerTime, statRGB);
        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Trigger Range', this.robotData[robotID].adjustedStats.triggerRange, statRGB);
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
        // Add robots
        for (var i = 0; i < this.robotData.length; i++) {
            this.arena.robotMap[this.robotData[i].pos.x][this.robotData[i].pos.y] = i;
        }
    }
    requestTrigger(robotID, action) {
        let robotCoord = this.robotData[robotID].pos;
        let targetCoord = action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = this.world.tiles[tileID].name;
        console.log(tileName);
        let powerCost = this.robotData[robotID].adjustedStats.triggerPower;
        // Is there power for this action?
        if (this.robotData[robotID].adjustedStats.power >= powerCost) {
            // Drain power
            this.robotData[robotID].adjustedStats.power -= powerCost;
            // Only act if the object is in reach.    
            if (robotCoord.getDistanceTo(targetCoord) < reach) {
                var delay = 0;
                // Select action based on target.
                switch (tileName) {
                    case "Power Station":
                        // Set time delay.
                        delay = 1;
                        break;
                    case "Repair Bay":
                        // Set time delay.
                        delay = 1;
                        break;
                    case "Closed Door":
                        // Set time delay.
                        delay = 1;
                        break;
                    case "Open Door":
                        // Set time delay.
                        delay = 1;
                        break;
                }
                // Add action to event que.
                this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
                // Animate display elements
                this.batteryColor[robotID].activate();
                this.powerColor[robotID].activate();
            }
        }
    }
    resolveTrigger(event) {
        let robotCoord = this.robotData[event.robotID].pos;
        let targetCoord = event.action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = this.world.tiles[tileID].name;
        // Only act if the object is in reach.    
        if (robotCoord.getDistanceTo(targetCoord) < reach) {
            // Select action based on target.
            switch (tileName) {
                case "Power Station":
                    this.robotData[event.robotID].adjustedStats.power = this.robotData[event.robotID].adjustedStats.maxPower;
                    break;
                case "Repair Bay":
                    this.robotData[event.robotID].adjustedStats.HPs = this.robotData[event.robotID].adjustedStats.maxHPs;
                    break;
                case "Closed Door":
                    this.arena.toggleDoor(targetCoord);
                    break;
                case "Open Door":
                    this.arena.toggleDoor(targetCoord);
                    break;
            }
            // Animate display elements
            this.batteryColor[event.robotID].deactivate();
            this.powerColor[event.robotID].deactivate();
        }
    }
    requestMove(robotID, action) {
        let powerCost = this.robotData[robotID].adjustedStats.movePower;
        let destination = this.robotData[robotID].pos.getPathTo(action.target)[0];
        // Is there power for this action?
        if (this.robotData[robotID].adjustedStats.power >= powerCost) {
            // Drain power  
            this.robotData[robotID].adjustedStats.power -= powerCost;
            // Set time delay and adjust for distance across diagonals.
            let delay = this.robotData[robotID].adjustedStats.moveTime;
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
        if (this.arena.getTileSpeed(destination) > 0) {
            // Change position in arena.
            this.arena.robotMap[this.robotData[action.robotID].pos.x][this.robotData[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;
            // Change position in stats.
            this.robotData[action.robotID].pos = destination;
        }
        else {
            // Take damage if you run into something.
            this.robotData[action.robotID].adjustedStats.HPs -= 10;
            this.hpsColor[action.robotID].pulse();
            this.chassisColor[action.robotID].pulse();
        }
        // Animate display elements.
        this.coreColor[action.robotID].deactivate();
        this.batteryColor[action.robotID].deactivate();
        this.powerColor[action.robotID].deactivate();
    }
    requestActivate(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            // Set time delay..
            let slotName = this.robotData[robotID].items[itemID].slot;
            let slotID = this.robotData[robotID].slots.findLastIndex(d => d.name === slotName);
            let delay = this.robotData[robotID].slots[slotID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveActivate(event) {
        // Move item to the top of the list and set to active.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items.unshift(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
            this.robotData[event.robotID].items[0].isActive = true;
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestInactivate(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            // Set time delay..
            let slotName = this.robotData[robotID].items[itemID].slot;
            let slotID = this.robotData[robotID].slots.findLastIndex(d => d.name === slotName);
            let delay = this.robotData[robotID].slots[slotID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
        }
    }
    resolveInactivate(event) {
        // Move item to the bottom of the list and set to inactive.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.robotData[event.robotID].items[itemID].isActive = false;
            this.robotData[event.robotID].items.push(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
        }
        // Equipe items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
    }
    requestDrop(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if (itemID >= 0) {
            // Set time delay..
            let slotName = this.robotData[robotID].items[itemID].slot;
            let slotID = this.world.slots.findLastIndex(d => d.name === slotName);
            let delay = this.world.slots[slotID].timeToEquip;
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));
            console.log("Dropping item");
        }
    }
    resolveDrop(event) {
        // Move item to the corresponding location on the map.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        let location = this.robotData[event.robotID].pos;
        if (itemID >= 0) {
            this.robotData[event.robotID].items[itemID].isActive = false;
            this.arena.itemMap[location.x][location.y].push(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
        }
        // Equip items and apply mods.
        this.equipItems(this.robotData[event.robotID]);
        console.log("Dropped item");
    }
    requestScan(botID, call) {
        let powerCost = this.robotData[botID].adjustedStats.scanPower;
        // Is there power for this action?
        if (this.robotData[botID].adjustedStats.power >= powerCost) {
            // Drain power
            this.robotData[botID].adjustedStats.power -= powerCost;
            // Set scan range and delay.
            call.range = this.robotData[botID].adjustedStats.scanRange;
            let delay = this.robotData[botID].adjustedStats.scanTime;
            // Add action to event queue.
            this.events.push(new GameEvent(botID, call, delay + this.gameTime));
            // Animate display elements.
            this.scannerColor[botID].activate();
            this.batteryColor[botID].activate();
            this.powerColor[botID].activate();
        }
    }
    resolveScan(event) {
        // Set rane and perform scan.        
        let range = this.robotData[event.robotID].adjustedStats.scanRange;
        this.scanData[event.robotID] = this.arena.scan(this.robotData[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        // Animate display elements.
        this.scannerColor[event.robotID].deactivate();
        this.batteryColor[event.robotID].deactivate();
        this.powerColor[event.robotID].deactivate();
    }
    equipItems(robot) {
        // Uniquip all items.
        for (var i = 0; i < robot.items.length; i++) {
            robot.items[i].isEquipped = false;
        }
        // Add items to slots.
        for (var i = 0; i < robot.slots.length; i++) {
            if (robot.slots[i].count > 0) {
                for (var j = 0; j < robot.slots[i].count; j++) {
                    let slotName = robot.slots[i].name;
                    let ID = robot.items.findIndex((d) => d.slot === slotName && !d.isEquipped);
                    if (ID >= 0)
                        robot.items[ID].isEquipped = true;
                }
            }
        }
        // Inactivate all unequipped items.
        for (var i = 0; i < robot.items.length; i++) {
            if (!robot.items[i].isEquipped)
                robot.items[i].isActive = false;
        }
        // Recompute attributes based on active items.
        robot.adjustedStats.copy(robot.baseStats, false);
        // Apply mods from equipped items.
        for (var i = 0; i < robot.items.length; i++) {
            if (robot.items[i].isActive) {
                robot.adjustedStats.add(robot.items[i].effects);
            }
        }
    }
    /**
     * Removes the last named item from the inventory and re-evaluates which
     * items are equipped.
     *
     * @param item
     */
    dropItem(robot, item) {
    }
    /**
     * Adds the specified item to the end of the robot's inventory.
     *
     * @param item
     */
    carryItem(robot, item) {
    }
}

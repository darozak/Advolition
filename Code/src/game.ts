class Game {
    gameTime: number;
    world: WorldData;
    arena: Arena;
    events: GameEvent[] = [];
    programs: Program[] = [];
    robotData: RobotData[] = [];
    scanData: ScanData[] = [];
    paper: Paper;
    sysTime = new Date();

    powerColor: RampedArray[] = [];
    hpsColor: RampedArray[] = [];
    chassisColor: RampedArray[] = [];
    coreColor: RampedArray[] = [];
    scannerColor: RampedArray[] = [];
    batteryColor: RampedArray[] = [];


    constructor(world: WorldData) {
        this.gameTime = 0;
        this.world = world;

        this.arena = new Arena(this.world, this.robotData);
        this.arena.generate();
        this.paper = new Paper();
    } 

    addRobot(robot: Program, name: string) {
        this.programs.push(robot);
        let robotID = this.programs.length-1;
        this.robotData.push(new RobotData(this.world, robotID, name));
        this.scanData.push(new ScanData(this.world, this.robotData[robotID]));
        this.arena.robotMap[this.robotData[robotID].pos.x][this.robotData[robotID].pos.y] = robotID; 
        
        this.robotData[robotID].chassis.HPs = 50;

        // Uniquip all items.
        for(var i = 0; i < this.robotData[robotID].items.length; i ++) {
            this.robotData[robotID].items[i].isEquipped = false;
        }

        // Add items to slots.
        for(var i = 0; i < this.robotData[robotID].slots.length; i ++) {
            if(this.robotData[robotID].slots[i].count  > 0) {
                for(var j = 0; j < this.robotData[robotID].slots[i].count; j ++) {
                    let slotName = this.robotData[robotID].slots[i].name;
                    let ID = this.robotData[robotID].items.findIndex((d) => d.slot === slotName && !d.isEquipped);
                    if(ID >= 0) this.robotData[robotID].items[ID].isEquipped = true;
                }
            }
        }

        this.powerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.hpsColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.chassisColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.coreColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.scannerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3])); 
        this.batteryColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
    }

    run() { 
        // Increment game time
        this.gameTime ++; 

        
        for(var i = 0; i < this.programs.length; i++) {

            // If the robot is still alive and isn't doing anything.
            if(this.robotData[i].chassis.HPs > 0 && !this.events.some(d =>d.robotID == i)){
                var action: Action = new Action(); 

                // Make sure the robot's personal data is up to date in scanData.
                this.scanData[i].robots[i] = structuredClone(this.robotData[i]);
                
                this.scanData[i].robots[i].scanTime = this.gameTime;

                // Let the robot run it's code.
                action = this.programs[i].run(i, structuredClone(this.scanData[i]), action);

                    if(action) {
                        switch (action.command) {
                            case "activate":
                                this.requestActivate(i, action);
                                break;
                            case "equip":
                                this.requestEquip(i, action);
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
            if(this.events.length > 0) {

                // Sort the events in chronological order.
                this.events.sort((a,b) => a.duration - b.duration);

                // Evaluate any events that should have occurred by now.
                while(this.events[0].duration <= this.gameTime) {
                    switch (this.events[0].action.command) {
                        case "activate":
                            this.resolveActivate(this.events[0]);
                            break;
                        case "equip":
                            this.resolveEquip(this.events[0]);
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
                    if(this.events.length == 0) break;
                }
            } 
        

            // Every frame, redraw the game window.
            this.paper.erasePaper();
            for(var i = 0; i < this.robotData.length; i++) {
                this.displayRobotStats(i);
        }
    }
    
    displayRobotStats(robotID: number) {
        var spriteWidth = 10;
        var mapRadius = 7;
        var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
        var leftMapFrame = 10 + robotID * (mapFrameSize + 10); 
        var topMapFrame = 10;
        var centerTextFrame = mapFrameSize / 2 + leftMapFrame;
        var topTextFrame = topMapFrame + mapFrameSize + 20;
        var lineSpacing = 20;
        
        var x0 = this.robotData[robotID].pos.x - mapRadius;
        var y0 = this.robotData[robotID].pos.y - mapRadius;
        var x1 = this.robotData[robotID].pos.x + mapRadius;
        var y1 = this.robotData[robotID].pos.y + mapRadius;
        

        // Cycle through all the tiles in the scan display box.
        for(var i = x0; i < x1; i++) {
            for(var j = y0; j < y1; j++) {
                var tileScanID = -1;
                var robotScanID = -1;
                var tileAlpha = 0;
                var robotAlpha = 0;

                // Grab tile and robot IDs if the plotted region doesn't fall outside of the arena map.
                if(i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                    tileScanID = this.scanData[robotID].tileMap[i][j];
                    robotScanID = this.scanData[robotID].robotMap[i][j];

                    // Scan will fade as data ages.
                    let decayRate = 0.02;
                    let decayFloor = 0.3;
                    tileAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].scanTime[i][j]);
                    if(robotScanID >= 0) {
                        robotAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].robots[robotScanID].scanTime);
                    }
                }

                // Draw tile.
                if(tileScanID >= 0) {
                    this.paper.drawTile(
                        leftMapFrame,
                        topMapFrame,
                        this.world.tiles[tileScanID].sprite,
                        new Vector(i-x0, j-y0),
                        tileAlpha,
                        false);
                }

                // Draw robot.
                if(robotScanID >= 0) {
                    this.paper.drawTile(
                        leftMapFrame,
                        topMapFrame,
                        this.robotData[robotScanID].chassis.sprite,
                        new Vector(i-x0, j-y0),
                        robotAlpha,
                        false);
                }
            }
        }
      
        // Draw self in center of map.
        this.paper.drawTile(
            leftMapFrame, 
            topMapFrame,
            this.robotData[robotID].chassis.sprite, 
            new Vector(mapRadius, mapRadius), 
            1,
            true);

        // Draw a frame around the map.
        this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);  
        
        // Display text
        let statRGB = [180, 180, 180];
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.robotData[robotID].name, statRGB);

        topTextFrame += lineSpacing * 2;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.robotData[robotID].pos.print(), statRGB);

        topTextFrame += lineSpacing;
        let hps: string = this.robotData[robotID].chassis.HPs + '/' + this.robotData[robotID].chassis.maxHPs;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'HPs', hps, this.hpsColor[robotID].value());

        topTextFrame += lineSpacing; 
        let power: string = this.robotData[robotID].battery.currentPower + '/' + this.robotData[robotID].battery.maxPower;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', power, this.powerColor[robotID].value());

        topTextFrame += lineSpacing * 2;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Chassis', this.robotData[robotID].chassis.name, this.chassisColor[robotID].value());

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Battery', this.robotData[robotID].battery.name, this.batteryColor[robotID].value());

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Core', this.robotData[robotID].core.name, this.coreColor[robotID].value());

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Scanner', this.robotData[robotID].scanner.name, this.scannerColor[robotID].value());

        topTextFrame += lineSpacing * 2;
        this.paper.drawListItem(centerTextFrame, topTextFrame, 'Slots', [120, 120, 120]);

       


        for(var i = 0; i < this.robotData[robotID].slots.length; i ++) {
            topTextFrame += lineSpacing;
            let slotName = this.robotData[robotID].slots[i].name;
            let slotCount = this.robotData[robotID].slots[i].count;
            if(slotCount > 0) {
                this.paper.showStatus(centerTextFrame, topTextFrame, slotName, slotCount, [180, 180, 180]);
            }
        }

        topTextFrame += lineSpacing * 2;
        this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);

        for(var i = 0; i < this.robotData[robotID].items.length; i ++) {
            var color = [180, 180, 180];
            if(this.robotData[robotID].items[i].isEquipped) color = [51, 110, 156];

            topTextFrame += lineSpacing;
            this.paper.drawListItem(centerTextFrame, topTextFrame, this.robotData[robotID].items[i].name, color);
        }
    } 

    decay(decayRate: number, decayFloor: number, elapsedTime: number) {
        if(decayRate > 1) decayRate = 1;
        if(decayFloor > 1) decayFloor = 1;

        // f(x) = (1-f)(1 – r)^t
        return (1-decayFloor) * Math.pow((1 - decayRate),elapsedTime) + decayFloor;
    }

    updateRobotPositions() {
        // Clear grid
        for(var i = 0; i < this.world.size.x; i++) {
            for(var j = 0; j < this.world.size.y; j++) {
                this.arena.robotMap[i][j] = -1;
            } 
        }

        // Add robots
        for(var i = 0; i < this.robotData.length; i++) {
            this.arena.robotMap[this.robotData[i].pos.x][this.robotData[i].pos.y] = i;
        }
    }

    requestActivate(robotID: number, action: Action) {

        let robotCoord = this.robotData[robotID].pos;
        let targetCoord = action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = this.world.tiles[tileID].name; 
        console.log(tileName);

        let powerCost = this.robotData[robotID].core.power[action.powerLevel];

        // Is there power for this action?
        if(this.robotData[robotID].battery.currentPower >= powerCost) {

            // Drain power
            this.robotData[robotID].battery.currentPower -= powerCost;

            // Only act if the object is in reach.    
            if(robotCoord.getDistanceTo(targetCoord) < reach) {

                var delay = 0;

                // Select action based on target.
                switch(tileName) {
                    case "Power Station":
                        // Set time delay.
                        delay  = 1;
                        break;
                    case "Repair Bay":
                        // Set time delay.
                        delay  = 1;
                        break;
                    case "Closed Door":
                        // Set time delay.
                        delay  = 1;
                        break;
                    case "Open Door":
                        // Set time delay.
                        delay  = 1;
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

    resolveActivate(event: GameEvent) {
        let robotCoord = this.robotData[event.robotID].pos;
        let targetCoord = event.action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = this.world.tiles[tileID].name;
        
        // Only act if the object is in reach.    
        if(robotCoord.getDistanceTo(targetCoord) < reach) {

            // Select action based on target.
            switch(tileName) {
                case "Power Station":
                    this.robotData[event.robotID].battery.currentPower = this.robotData[event.robotID].battery.maxPower;
                    break;
                case "Repair Bay":
                    this.robotData[event.robotID].chassis.HPs = this.robotData[event.robotID].chassis.maxHPs;
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

    requestEquip(robotID: number, action: Action) {

        // Does item exist in inventory?
        let itemID = this.robotData[robotID].items.findLastIndex(d => d.name === action.item);
        if(itemID >= 0) {
    
            // Set time delay..
            let slotName = this.robotData[robotID].items[itemID].slot;
            let slotID = this.robotData[robotID].slots.findLastIndex(d => d.name === slotName);
            let delay = this.robotData[robotID].slots[slotID].timeToEquip;

            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime)); 
        }
    }

    resolveEquip(event: GameEvent) {

        // Move item to the top of the list.
        let itemID = this.robotData[event.robotID].items.findLastIndex(d => d.name === event.action.item);
        if(itemID >= 0) {
            this.robotData[event.robotID].items.unshift(this.robotData[event.robotID].items.splice(itemID, 1)[0]);
        }

        // Uniquip all items.
        for(var i = 0; i < this.robotData[event.robotID].items.length; i ++) {
            this.robotData[event.robotID].items[i].isEquipped = false;
        }

        // Add items to slots.
        for(var i = 0; i < this.robotData[event.robotID].slots.length; i ++) {
            if(this.robotData[event.robotID].slots[i].count  > 0) {
                for(var j = 0; j < this.robotData[event.robotID].slots[i].count; j ++) {
                    let slotName = this.robotData[event.robotID].slots[i].name;
                    let ID = this.robotData[event.robotID].items.findIndex((d) => d.slot === slotName && !d.isEquipped);
                    if(ID >= 0) this.robotData[event.robotID].items[ID].isEquipped = true;
                }
            }
        }

    }

    requestMove(robotID: number, action: Action) { 

        let powerCost = this.robotData[robotID].core.power[action.powerLevel];
        let destination = this.robotData[robotID].pos.getPathTo(action.target)[0];

        // Is there power for this action?
        if(this.robotData[robotID].battery.currentPower >= powerCost) {

            // Drain power  
            this.robotData[robotID].battery.currentPower -= powerCost;

            // Set time delay and adjust for distance across diagonals.
            let delay = this.robotData[robotID].core.speed[action.powerLevel];
            delay *= this.robotData[robotID].pos.getDistanceTo(destination);

            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, delay + this.gameTime));   
            
            // Animate display elements
            this.coreColor[robotID].activate();
            this.batteryColor[robotID].activate();
            this.powerColor[robotID].activate();
        }
    }

    resolveMove(action: GameEvent) {
        var destination = this.robotData[action.robotID].pos.getPathTo(action.action.target)[0];
        if (this.arena.getTileSpeed(destination) > 0) {
            
            // Change position in arena.
            this.arena.robotMap[this.robotData[action.robotID].pos.x][this.robotData[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;

            // Change position in stats.
            this.robotData[action.robotID].pos = destination;
            
        } else {
            // Take damage if you run into something.
            this.robotData[action.robotID].chassis.HPs -= 10;
            this.hpsColor[action.robotID].pulse();
            this.chassisColor[action.robotID].pulse();
        }

        // Animate display elements.
        this.coreColor[action.robotID].deactivate();
        this.batteryColor[action.robotID].deactivate();
        this.powerColor[action.robotID].deactivate();
    }

    requestScan(botID: number, call: Action) {

        let powerCost = this.robotData[botID].scanner.power[call.powerLevel];

        // Is there power for this action?
        if(this.robotData[botID].battery.currentPower >= powerCost) {
            
            // Drain power
            this.robotData[botID].battery.currentPower -= powerCost;

            // Set scan range and delay.
            call.range = this.robotData[botID].scanner.range[call.powerLevel];
            let delay = this.robotData[botID].core.speed[call.powerLevel];

            // Add action to event queue.
            this.events.push(new GameEvent(botID, call, delay + this.gameTime));

            // Animate display elements.
            this.scannerColor[botID].activate();
            this.batteryColor[botID].activate();
            this.powerColor[botID].activate();
        }
    }

    resolveScan(event: GameEvent) {

        // Set rane and perform scan.        
        let range = this.robotData[event.robotID].scanner.range[event.action.powerLevel];
        this.scanData[event.robotID] = this.arena.scan(this.robotData[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        
        // Animate display elements.
        this.scannerColor[event.robotID].deactivate();
        this.batteryColor[event.robotID].deactivate();
        this.powerColor[event.robotID].deactivate();
    }






    modAttributes(attributes: Attributes, modifications: Attributes) {
        attributes.HPs.current, modifications.HPs.current;
        attributes.maxHPs.current, modifications.maxHPs.current;
        attributes.power.current, modifications.power.current;
        attributes.maxPower.current, modifications.maxPower.current;
        attributes.damage.current, modifications.damage.current;
        attributes.defense.current, modifications.defense.current;
        attributes.moveTime.current, modifications.moveTime.current;
    }

    resetAttributes(attributes: Attributes) {
        attributes.maxHPs.current = attributes.maxHPs.base;
        attributes.maxPower.current = attributes.maxPower.base;
        attributes.damage.current = attributes.damage.base;
        attributes.defense.current = attributes.defense.base;
        attributes.moveTime.current = attributes.moveTime.base;
    }

    applyEquippedMods(robot: RobotData) {
        this.resetAttributes(robot.attributes);

        // Identify equipped items.

        // Apply mods from equipped items.
        for(var i = 0; i < robot.items.length; i ++) {
            if(robot.items[i].isEquipped) {
                // robot.stats.applyMods(robot.item[i].effects);
                this.modAttributes(robot.attributes, robot.items[i].effects)
            }
        }
    }

    /**
     * Moves the last of the named items on the equipment list
     * to the top of the equipment list.  It then re-evaluates
     * which items are equipped based on the slots that the robot
     * has available.
     * 
     * @param robot
     * @param item 
     */
    equipItem(robot: RobotData, item: string) {

        // Move item to the top of the list.
        let ID = robot.items.findLastIndex(d => d.name === item);
        if(ID >= 0) {
            robot.items.unshift(robot.items.splice(ID, 1)[0]);
        }

        // Uniquip all items.
        for(var i = 0; i < robot.items.length; i ++) {
            robot.items[i].isEquipped = false;
        }

        // Add items to slots.
        for(var i = 0; i < robot.slots.length; i ++) {
            if(robot.slots[i].count  > 0) {
                for(var j = 0; j < robot.slots[i].count; j ++) {
                    let slotName = robot.slots[i].name;
                    let ID = robot.items.findIndex((d) => d.slot === slotName && !d.isEquipped);
                    if(ID >= 0) robot.items[ID].isEquipped = true;
                }
            }
        }

    }

    /**
     * Sets the first inactive named item on the equipment list to active.
     *  
     * @param item 
     */
    activateItem(robot: RobotData, item: string) {
        
    }


    /**
     * Sets the first active named item on the equipment list to inactive.
     * 
     * @param item 
     */
    inactivateItem(robot: RobotData, item: string) {
        
    }

    /**
     * Removes the last named item from the inventory and re-evaluates which
     * items are equipped.
     * 
     * @param item 
     */
    dropItem(robot: RobotData, item: string) {
        
    }


    /**
     * Adds the specified item to the end of the robot's inventory.
     * 
     * @param item 
     */
    carryItem(robot: RobotData, item: Item) {

    }

}
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
                            case "move":
                                this.requestMove(i, action);
                                break;
                            case "scan":
                                this.requestScan(i, action);
                                break;
                            case "activate":
                                this.requestActivate(i, action);
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
                        case "move":
                            this.resolveMove(this.events[0]);
                            break;
                        case "scan":
                            this.resolveScan(this.events[0]);
                            break;
                        case "activate":
                            this.resolveActivate(this.events[0]);
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

    requestActivate(robotID: number, action: Action) {

        let robotCoord = this.robotData[robotID].pos;
        let targetCoord = action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = gaia.tiles[tileID].name; 

        let powerCost = this.robotData[robotID].core.power[action.powerLevel];

        // Is there power for this action?
        if(this.robotData[robotID].battery.currentPower >= powerCost) {

            // Drain power
            this.robotData[robotID].battery.currentPower -= powerCost;

            // Only act if the object is in reach.    
            if(robotCoord.getDistanceTo(targetCoord) < reach) {

                // Select action based on target.
                switch(tileName) {
                    case "Power Station":
                        // Set time delay.
                        let delay  = 1;

                        // Add action to event que.
                        this.events.push(new GameEvent(robotID, action, delay + this.gameTime));   
                        
                        // Animate display elements
                        this.batteryColor[robotID].activate();
                        this.powerColor[robotID].activate();    
                        break;
                }
            }
        }
    }

    resolveActivate(event: GameEvent) {
        let robotCoord = this.robotData[event.robotID].pos;
        let targetCoord = event.action.target;
        let reach = 1.8;
        let tileID = this.arena.tileMap[targetCoord.x][targetCoord.y];
        let tileName = gaia.tiles[tileID].name;
        
        // Only act if the object is in reach.    
        if(robotCoord.getDistanceTo(targetCoord) < reach) {

            // Select action based on target.
            switch(tileName) {
                case "Power Station":
                    this.robotData[event.robotID].battery.currentPower = this.robotData[event.robotID].battery.maxPower;

                    // Animate display elements
                    this.batteryColor[event.robotID].deactivate();
                    this.powerColor[event.robotID].deactivate();
                return;
            }
        }

    }
}
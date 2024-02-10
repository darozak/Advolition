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

        // Every ten frames, evaluate the bots that don't have active actions
        if(this.gameTime % 10 == 0) {
            for(var i = 0; i < this.programs.length; i++) {

                // If the robot is still alive and isn't doing anything.
                if(this.robotData[i].chassis.isAlive() && !this.events.some(d =>d.botID == i)){
                    var action = new Action(); 

                    // Make sure the robot's personal data is up to date in scanData.
                    this.scanData[i].robots[i] = this.robotData[i].clone(this.gameTime);

                    // Let the robot run it's code.
                    this.programs[i].run(i, structuredClone(this.scanData[i]), action);

                    // Evaluate the requested action.
                    switch (action.params.command) {
                        case "move":
                            this.requestMove(i, action);
                            break;
                        case "scan":
                            this.requestScan(i, action);
                            break;
                    }
                }
            }

            // Then resolve and remove any actions that are occuring now.
            if(this.events.length > 0) {

                // Sort the events in chronological order.
                this.events.sort((a,b) => a.time - b.time);

                // Evaluate any events that should have occurred by now.
                while(this.events[0].time <= this.gameTime) {
                    switch (this.events[0].call.params.command) {
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
                        robotAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].robots[robotScanID].lastScan);
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
        let power: string = this.robotData[robotID].battery.power + '/' + this.robotData[robotID].battery.maxPower;
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

    requestMove(botID: number, call: Action) { 
        if(this.robotData[botID].battery.usePower(this.robotData[botID].core.power(call.params.power))) {

            // Set time delay.
            let delay = this.robotData[botID].core.speed(call.params.power);

            this.events.push(new GameEvent(botID, call, delay + this.gameTime));   
            
            this.coreColor[botID].activate();
            this.batteryColor[botID].activate();
            this.powerColor[botID].activate();
        }
    }

    requestScan(botID: number, call: Action) {
        if(this.robotData[botID].battery.usePower(this.robotData[botID].scanner.power(call.params.power))) {
            call.params.range = this.robotData[botID].scanner.range(call.params.power);
            let delay = this.robotData[botID].core.speed(call.params.power);

            this.events.push(new GameEvent(botID, call, delay));

            this.scannerColor[botID].activate();
            this.batteryColor[botID].activate();
            this.powerColor[botID].activate();
        }
    }

    resolveMove(action: GameEvent) {
        var destination = this.robotData[action.botID].pos.getPathTo(action.call.params.coord)[0];
        if (this.arena.getTileSpeed(destination) > 0) {
            
            // Change position in arena.
            this.arena.robotMap[this.robotData[action.botID].pos.x][this.robotData[action.botID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.botID;

            // Change position in stats.
            this.robotData[action.botID].pos = destination;
            
        } else {
            // Take damage if you run into something.
            this.robotData[action.botID].chassis.takeDamage(10);
            this.hpsColor[action.botID].pulse();
            this.chassisColor[action.botID].pulse();
        }
        this.coreColor[action.botID].deactivate();
        this.batteryColor[action.botID].deactivate();
        this.powerColor[action.botID].deactivate();
    }

    resolveScan(action: GameEvent) {
        
        let range = this.robotData[action.botID].scanner.range(action.call.params.power);
        this.scanData[action.botID] = this.arena.scan(this.robotData[action.botID].pos, range, this.scanData[action.botID], this.gameTime);
        

        this.scannerColor[action.botID].deactivate();
        this.batteryColor[action.botID].deactivate();
        this.powerColor[action.botID].deactivate();
    }
}
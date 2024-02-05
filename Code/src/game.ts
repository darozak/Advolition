class Game {
    gameTime: number;
    world: World;
    arena: Arena;
    actions: Action[];
    bots: Robot[];
    stats: Status[];
    paper: Paper;
    sysTime = new Date();

    constructor(world: World) {
        this.gameTime = 0;
        this.world = world;
        this.bots = [];
        this.stats = [];
        this.actions = [];

        this.arena = new Arena(world);
        this.arena.generate();
        this.paper = new Paper();
    } 

    addBot(bot: Robot, name: string) {
        this.bots.push(bot);
        let robotID = this.bots.length-1;
        this.stats.push(new Status(this.world, robotID, name));
        this.arena.robots[this.stats[robotID].pos.x][this.stats[robotID].pos.y] = robotID;  
    }

    run() {
        // Increment game time
        this.gameTime ++;

        // Evaluate bots that don't have active actions
        for(var i = 0; i < this.bots.length; i++) {
            if(!this.actions.some(d =>d.botID == i)){
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
        if(this.actions.length > 0) {
            this.actions.sort((a,b) => a.time - b.time);
            while(this.actions[0].time <= this.gameTime) {
                switch (this.actions[0].call.params.command) {
                    case "move":
                        this.resolveMove(this.actions[0]);
                        break;
                    case "scan":
                        this.resolveScan(this.actions[0]);
                        break;
                }
                this.actions.shift();
                if(this.actions.length == 0) break;
            }
        } 

        this.paper.erasePaper();
        for(var i = 0; i < this.stats.length; i++) {
            this.displayRobotStats(i);
        }
    }
        
    wait(ms: number) {
        var start = Date.now(),
            now = start;
        while (now - start < ms) {
          now = Date.now();
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
        
        var x0 = this.stats[robotID].pos.x - mapRadius;
        var y0 = this.stats[robotID].pos.y - mapRadius;
        var x1 = this.stats[robotID].pos.x + mapRadius;
        var y1 = this.stats[robotID].pos.y + mapRadius;
        

        for(var i = x0; i < x1; i++) {
            for(var j = y0; j < y1; j++) {
                var tileScanID = -1;
                var robotScanID = -1;

                if(i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                    tileScanID = this.stats[robotID].scan.tiles[i][j];
                    robotScanID = this.stats[robotID].scan.robots[i][j];
                }

                // Draw tile.
                if(tileScanID >= 0) {
                    this.paper.drawTile(
                        leftMapFrame,
                        topMapFrame,
                        this.world.tiles[tileScanID].sprite,
                        new Vector(i-x0, j-y0),
                        this.stats[robotID].scan.visible[i][j],
                        false);
                }

                // Draw robot.
                if(robotScanID >= 0) {
                    this.paper.drawTile(
                        leftMapFrame,
                        topMapFrame,
                        this.stats[robotScanID].model.sprite,
                        new Vector(i-x0, j-y0),
                        this.stats[robotID].scan.visible[i][j],
                        false);
                }
            }
        }
      
        // Draw self in center of map.
        this.paper.drawTile(
            leftMapFrame, 
            topMapFrame,
            this.stats[robotID].model.sprite, 
            new Vector(mapRadius, mapRadius), 
            1,
            true);

        // Draw a frame around the map.
        this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);  
        
        // Display text
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.stats[robotID].name);

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Model', this.stats[robotID].model.name);

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.stats[robotID].pos.print());

        topTextFrame += lineSpacing;
        let hps: string = this.stats[robotID].currentHps + '/' + this.stats[robotID].model.maxHps;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'HPS', hps);

        topTextFrame += lineSpacing;
        let power: string = this.stats[robotID].currentPower + '/' + this.stats[robotID].model.maxPower;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Power', power);

        // List equipped equipment
        topTextFrame += 30;
        this.paper.drawCenteredList(
            centerTextFrame,
            topTextFrame,
            'Equipped Items', 
            [
                this.stats[robotID].core.name,
                this.stats[robotID].scanner.name
            ]
        );
    } 

    updateRobotPositions() {
        // Clear grid
        for(var i = 0; i < this.world.size.x; i++) {
            for(var j = 0; j < this.world.size.y; j++) {
                this.arena.robots[i][j] = -1;
            }
        }

        // Add robots
        for(var i = 0; i < this.stats.length; i++) {
            this.arena.robots[this.stats[i].pos.x][this.stats[i].pos.y] = i;
        }
    }

    requestMove(botID: number, call: Call) { 
        this.stats[botID].currentPower -= this.stats[botID].core.power(call.params.power);
        let delay = this.stats[botID].core.speed(call.params.power);

        this.actions.push(new Action(botID, call, delay + this.gameTime));     
    }

    requestScan(botID: number, call: Call) {
        this.stats[botID].currentPower -= this.stats[botID].scanner.power(call.params.power);
        call.params.range = this.stats[botID].scanner.range(call.params.power);
        let delay = this.stats[botID].core.speed(call.params.power);

        this.actions.push(new Action(botID, call, delay));
    }

    resolveMove(action: Action) {
        var destination = this.stats[action.botID].pos.getPathTo(action.call.params.coord)[0];
        if (this.arena.getTileSpeed(destination) > 0) {

            // Change position in arena.
            this.arena.robots[this.stats[action.botID].pos.x][this.stats[action.botID].pos.y] = -1;
            this.arena.robots[destination.x][destination.y] = action.botID;

            // Change position in stats.
            this.stats[action.botID].pos = destination;
        }
    }

    resolveScan(action: Action) {
        let range = this.stats[action.botID].scanner.range(action.call.params.power);
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, range);
    }
}
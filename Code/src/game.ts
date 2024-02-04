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
        this.stats.push(new Status(this.world, name));
        let robotID = this.stats.length-1;
        this.stats[robotID].pos = this.world.players[robotID].entrance;
        this.stats[robotID].sprite = this.world.players[robotID].sprite;
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
                var tileID = -1;
                if(i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                    tileID = this.stats[robotID].scan.tiles[i][j];
                }
                if(tileID >= 0) {
                    this.paper.drawTile(
                        leftMapFrame,
                        topMapFrame,
                        this.world.tiles[tileID].sprite,
                        new Vector(i-x0, j-y0),
                        this.stats[robotID].scan.visible[i][j]);
                }
            }
        }

        this.paper.drawTile(
            leftMapFrame, 
            topMapFrame,
            this.stats[robotID].sprite, 
            new Vector(mapRadius, mapRadius), 
            1);
        this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize);  
        
        // Display text
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Robot', this.stats[robotID].name);

        topTextFrame += lineSpacing;
        this.paper.showStatus(centerTextFrame, topTextFrame, 'Position', this.stats[robotID].pos.print());
    }

    requestMove(botID: number, call: Call) { 
        var time = this.gameTime + 2;
        this.actions.push(new Action(botID, call, time)); 
    }

    requestScan(botID: number, call: Call) {
        var time = this.gameTime + 2;
        this.actions.push(new Action(botID, call, time));
    }

    resolveMove(action: Action) {
        var destination = this.stats[action.botID].pos.getPathTo(action.call.params.coord)[0];
        if (this.arena.getTileSpeed(destination) > 0) {
            this.stats[action.botID].pos = destination;
        }
    }

    resolveScan(action: Action) {
        this.stats[action.botID].scan = this.arena.scan(this.stats[action.botID].pos, 5);
    }
}
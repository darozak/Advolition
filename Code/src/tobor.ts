class Splore {
    beyondTime = 10000;
    lastTransitTime: number[][] = [];
    doorValue = -1;
    floorValue = -1;
    unscannedValue = -1;

    initialized = false;

    constructor() {}

    init(myData: ScanData) {
        if(!this.initialized) {
            this.doorValue = myData.tiles.findLastIndex(d => d.name === 'Door');
            this.floorValue = myData.tiles.findLastIndex(d => d.name === 'Floor');
            this.beyondTime = myData.gameTime + 1;
            
            for(var i = 0; i < myData.mapSize.x; i ++) {
                this.lastTransitTime[i] = [];
                for(var j = 0; j < myData.mapSize.y; j ++) {
                    this.lastTransitTime[i][j] = this.beyondTime;
                }
            }

            this.initialized = true;
        } 

    }

    // STRATEGY: Confirm I have an unobstructed path to the target.
    isUnobstructed(myData: ScanData, target: Vector) {
        let isUnobstructed = true;
            
        let myPosition = new Vector(0,0);
        myPosition = myPosition.add(myData.robots[myData.myID].pos);
        
        let pathToTarget = myPosition.getPathTo(target);

        // Allows robot to explore options around corners.
        if(pathToTarget.length > 2) {
            pathToTarget.pop();
            pathToTarget.pop();
        }

        for(var i = 0; i < pathToTarget.length; i ++) {
            let tileType = myData.tileMap[pathToTarget[i].x][pathToTarget[i].y];
            
            if (tileType >= 0 && tileType < myData.tiles.length) {
                let isTransparent = myData.tiles[tileType].transparent;
                if(!isTransparent && tileType != this.doorValue)  isUnobstructed = false;
            } 
        }
        return isUnobstructed; 
    }

    // STRATEGY: Visit the accessible tile that I've neglected the longest.
    findAccessableTile(tileType: number, currentDestination: Vector, myData: ScanData) {
        let unobstructedTargets: Vector[] = [];

        // Find all unobstructed tiles.
        for(var i = 0; i < myData.mapSize.x; i ++) {
            for(var j = 0; j < myData.mapSize.y; j ++) {
                if(myData.tileMap[i][j] == tileType) {
                    let targetedLocation = new Vector(i, j);
                    let isNearUnscannedTile = true;
                    let maxRangeToUnscannedTile = 1;

                    if(tileType == this.floorValue) 
                        isNearUnscannedTile = this.isNearUnscannedTile(targetedLocation, maxRangeToUnscannedTile, myData); 
                    
                    if(isNearUnscannedTile && this.isUnobstructed(myData, targetedLocation)) unobstructedTargets.push(targetedLocation);
                }
            } 
        }

        // Select tile with latest transit time.
        let highestTransitTime = 0;

        if(unobstructedTargets.length > 0) {
            for(var i = 0; i < unobstructedTargets.length; i ++) {
                let xpos = unobstructedTargets[i].x;
                let ypos = unobstructedTargets[i].y;
                if(this.lastTransitTime[xpos][ypos] > highestTransitTime) {
                    highestTransitTime = this.lastTransitTime[xpos][ypos];
                    currentDestination.setEqualTo(unobstructedTargets[i]);
                }
            }
        }
    }

    isNearUnscannedTile(target: Vector, range: number, myData: ScanData) {
        let isNearUnscannedTile = false;
        
        for(var i = target.x - range; i <= target.x + range; i ++) {
            for(var j = target.y - range; j <= target.y + range; j ++) {
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType < 0) isNearUnscannedTile = true;
                }
            }
        }
        return isNearUnscannedTile;
    }

    getDestination(myData: ScanData) {
        this.init(myData);
        let destination = new Vector(0,0); 
  
        // *** Need to check for floor tiles not near unexplored space ***
        this.findAccessableTile(this.doorValue, destination, myData);
        this.findAccessableTile(this.floorValue, destination, myData);

        return destination;
    }

    // STRATEGY: Mark the visit time for current and surrounding tiles.
    markTransitTime(myData: ScanData) {
        this.init(myData);
        let myPos = myData.robots[myData.myID].pos;
        this.lastTransitTime[myPos.x][myPos.y] = myData.gameTime;   
    }
}

class Tobor extends Program {
    splore = new Splore();
    state = "equip";
    actionBuffer: Action[] = [];
    target = new Vector(3, 6);
    destination = new Vector(0,0);
    
    run(myData: ScanData) {
        var myAction = new Action(); 
        // var destination = new Vector(1,4);
        // var destination2 = new Vector(6,3);
        var myID = myData.myID;
        this.splore.markTransitTime(myData);
        
        if(this.actionBuffer.length < 1) {
            console.log(`Current state: ${this.state}`);
            switch (this.state) {
                case 'equip':
                    this.actionBuffer.push(new Equip('Scanner'));
                    this.actionBuffer.push(new Equip('Battery'));
                    this.actionBuffer.push(new Equip('Armor'));
                    this.state = 'scan';
                    break;
                case 'target':
                    this.destination = this.splore.getDestination(myData);
                    this.state = 'move';
                    break;
                case "move":
                    // let myPosition = myData.robots[myID].pos;
                    this.actionBuffer.push(new Move(this.destination));  
                    this.state = 'scan';
                    // if(myPosition.x === this.destination.x && myPosition.y === this.destination.y) this.state = "scan";
                    break;
                case "attack":
                    this.actionBuffer.push(new Attack(this.target));
                    this.actionBuffer.push(new Attack(this.target));
                    this.actionBuffer.push(new Attack(this.target));
                    this.state = "end";
                    break;
                case "scan":
                    this.actionBuffer.push(new Scan()); 
                    this.state = "target";
                    break;
                case "end":
                    break;
            }
        }
        
        if (this.actionBuffer.length > 0) {
            myAction = this.actionBuffer[0];
            this.actionBuffer.shift();           
        }        
        return myAction;
    }    
}

new Tobor();
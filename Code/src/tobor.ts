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

    isUnobstructed(target: Vector, myData: ScanData) {
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

    findAccessibleTile(targetedTileType: number, mustBeNearUnscannedTile: boolean, currentDestination: Vector, myData: ScanData) {
        let unobstructedTargets: Vector[] = [];
        let myPosition = myData.robots[myData.myID].pos;

        // Find all unobstructed tiles.
        for(var i = 0; i < myData.mapSize.x; i ++) {
            for(var j = 0; j < myData.mapSize.y; j ++) {
                if((i != myPosition.x || j != myPosition.y) && myData.tileMap[i][j] == targetedTileType) {
                    let targetedLocation = new Vector(i, j);
                    let isNearUnscannedTile = true;
                    let maxRangeToUnscannedTile = 1;

                    if(mustBeNearUnscannedTile) {
                        isNearUnscannedTile = this.isNearUnscannedTile(targetedLocation, maxRangeToUnscannedTile, myData); 
                    } else isNearUnscannedTile = true;

                    if(isNearUnscannedTile && this.isUnobstructed(targetedLocation, myData)) unobstructedTargets.push(targetedLocation);
                }
            } 
        }

        // Select tile that I never visited be for or that I visited a long time ago.
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
        this.findAccessibleTile(this.floorValue, false, destination, myData);
        this.findAccessibleTile(this.doorValue, false, destination, myData);
        this.findAccessibleTile(this.floorValue, true, destination, myData);
        return destination;
    }

    markTransitTime(myData: ScanData) {
        this.init(myData);
        let myPos = myData.robots[myData.myID].pos;
        this.lastTransitTime[myPos.x][myPos.y] = myData.gameTime;   
    }
}

class Drift {
    floorTile = 0;
    doorTile = 0;
    depth: number[][];

    constructor() {
        this.depth = [];
    }

    init(myData: ScanData) {
        this.doorTile = myData.tiles.findLastIndex(d => d.name === 'Door');
        this.floorTile = myData.tiles.findLastIndex(d => d.name === 'Floor');
        for(let i = 0; i < myData.mapSize.x; i++) {
            this.depth[i] = [];
            for(let j = 0; j < myData.mapSize.y; j ++) {
                this.depth[i][j] = 0;
            }
        }       
    }

    followFlow(target: Vector, myData: ScanData) {       
        this.floodDungeon(target, myData);

        let position = myData.robots[myData.myID].pos;
        let minX = position.x;
        let minY = position.y;
        let minDepth = this.depth[minX][minY];

        for(let i = position.x-1; i <= position.x+1; i ++) {
            for(let j = position.y-1; j <= position.y+1; j ++) { 
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType === this.doorTile || tileType === this.floorTile) {
                        console.log(`(${i},${j}): ${this.depth[i][j]}`); 
                        if(this.depth[i][j] < minDepth) {
                            minX = i;
                            minY = j;
                            minDepth = this.depth[i][j];
                        }
                    }
                }
            }
        }
        return new Vector(minX, minY);
    }

    floodDungeon(target: Vector, myData: ScanData) {       
        this.init(myData);
        let position =myData.robots[myData.myID].pos;
        let floodCycles = 500;
        let floodRate = 20;

        for(let cycle = 0; cycle < floodCycles; cycle ++) {
            this.depth[position.x][position.y] += floodRate;
            for(let i = 0; i < myData.mapSize.x; i ++) {
                for(let j = 0; j < myData.mapSize.y; j ++) {
                    this.levelWater(i, j, myData);
                    this.depth[target.x][target.y] = 0;
                }
            }
        }
    }

    isFlooded(sink: Vector, myData: ScanData) {
        for(let i = 0; i < myData.mapSize.x; i ++) {
            for(let j = 0; j < myData.mapSize.y; j ++) {
                if(!(i == sink.x && j == sink.y) && this.depth[i][j] == 0) return false;
            }
        }
        return true;        
    }

    getAverageDepth(x: number, y: number, myData: ScanData) {
        let averageDepth = 0;
        let tileCount = 0;

        for(let i = x-1; i <= x+1; i ++) {
            for(let j = y-1; j <= y+1; j ++) { 
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType == this.doorTile || tileType == this.floorTile) {
                        averageDepth += this.depth[i][j];
                        tileCount += 1;
                    }
                }
            }
        }
        return averageDepth / tileCount;
    }

    levelWater(x: number, y: number, myData: ScanData) {
        let averageDepth = this.getAverageDepth(x, y, myData);
        let levelingRate = 0.2; 

        for(let i = x-1; i <= x+1; i ++) {
            for(let j = y-1; j <= y+1; j ++) { 
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType == this.doorTile || tileType == this.floorTile) {
                        this.depth[i][j] += levelingRate * (averageDepth - this.depth[i][j]);
                    }
                }
            }
        }
    }
}

class Tobor extends Program {
    splore = new Splore();
    drift = new Drift();
    state = "equip";
    actionBuffer: Action[] = [];
    target = new Vector(3, 6);
    startPosition = new Vector(0, 0);
    destination = new Vector(0,0);
    stepCounter = 0;
    
    run(myData: ScanData) {
        var myAction = new Action(); 
        this.splore.markTransitTime(myData);
        
        if(this.actionBuffer.length < 1) {
            console.log(`Current state: ${this.state}`);
            switch (this.state) {
                case 'equip':
                    this.startPosition.setEqualTo(myData.robots[myData.myID].pos)
                    this.actionBuffer.push(new Equip('Scanner'));
                    this.actionBuffer.push(new Equip('Battery'));
                    this.actionBuffer.push(new Equip('Armor'));
                    this.state = 'scan';
                    break;
                case 'target':
                    if(this.stepCounter < 15) {
                        this.destination = this.splore.getDestination(myData);
                        
                    } else {
                        // let returnPath = this.drift.getPath(this.startPosition, myData);
                        // this.destination = returnPath[0];
                        // this.drift.floodDungeon(this.startPosition, myData);
                        console.log("Going with the flow!");
                        this.destination = this.drift.followFlow(this.startPosition, myData);
                    }
                    this.state = 'move';
                    break;
                case "move":
                    this.actionBuffer.push(new Move(this.destination));
                    
                    // if(this.stepCounter < 15) {
                    //     this.drift.floodDungeon(this.startPosition, myData);
                    // }
                    this.stepCounter += 1; 
                    console.log(`Step counter: ${this.stepCounter}`);
                    this.state = 'scan';
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
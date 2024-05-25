
class Drift {
    unscannedTileID = -1;
    floorTileID = 0;
    doorTileID = 0;
    waterDepth: number[][] = [];

    constructor() {}

    init(myData: ScanData) {
        this.doorTileID = myData.tiles.findLastIndex(d => d.name === 'Door');
        this.floorTileID = myData.tiles.findLastIndex(d => d.name === 'Floor');
        for(let i = 0; i < myData.mapSize.x; i++) {
            this.waterDepth[i] = [];
            for(let j = 0; j < myData.mapSize.y; j ++) {
                this.waterDepth[i][j] = 0;
            }
        }       
    }

    followFlow(drainLocation: Vector, myData: ScanData) {
        let drainTileID = myData.tileMap[drainLocation.x][drainLocation.y];
        let drainList: Vector[] = [];

        // Drain water from edge tiles if drainLocation is invalid.
        if(drainLocation.x >= 0 && drainLocation.x < myData.mapSize.x &&
            drainLocation.y >= 0 && drainLocation.y < myData.mapSize.y &&
            (drainTileID == this.doorTileID || drainTileID == this.floorTileID)) {
                drainList.push(drainLocation);
            } else {
                drainList = this.listBoarderTiles(myData);
                if(drainList.length == 0) return myData.robots[myData.myID].pos;
            }

        this.floodDungeon(drainList, myData);

        // Deturmine local water flow
        let currentPosition = myData.robots[myData.myID].pos;
        let minX = currentPosition.x;
        let minY = currentPosition.y;
        let minDepth = this.waterDepth[minX][minY];

        for(let i = currentPosition.x-1; i <= currentPosition.x+1; i ++) {
            for(let j = currentPosition.y-1; j <= currentPosition.y+1; j ++) { 
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType === this.doorTileID || tileType === this.floorTileID) {
                        // console.log(`(${i},${j}): ${this.waterDepth[i][j]}`); 
                        if(this.waterDepth[i][j] < minDepth) {
                            minX = i;
                            minY = j; 
                            minDepth = this.waterDepth[i][j];
                        }
                    }
                }
            }
        }
        let localWaterFlow = new Vector(minX, minY);

        return localWaterFlow;
    }

    floodDungeon(drainLocations: Vector[], myData: ScanData) {    
        this.init(myData);

        let faucetLocation = myData.robots[myData.myID].pos;
        let floodCycles = 5000;
        let faucetRate = 10;

        for(let cycle = 0; cycle < floodCycles; cycle ++) {

            // Disperse water throughout dungeon.
            this.waterDepth[faucetLocation.x][faucetLocation.y] += faucetRate;
            let temporaryDepth = structuredClone(this.waterDepth);
            for(let i = 0; i < myData.mapSize.x; i ++) {
                for(let j = 0; j < myData.mapSize.y; j ++) {
                    let averageDepth = this.getAverageDepth(i, j, myData);
                    temporaryDepth[i][j] += 2*Math.random() * (averageDepth - this.waterDepth[i][j]);
                }
            }
            this.waterDepth = temporaryDepth;

            // Remove water from drain tiles.
            for(let i = 0; i < drainLocations.length; i ++) {
                this.waterDepth[drainLocations[i].x][drainLocations[i].y] = 0;
            }
        }      
    }

    getAverageDepth(x: number, y: number, myData: ScanData) {
        let averageDepth = 0;
        let tileCount = 0;

        for(let i = x-1; i <= x+1; i ++) {
            for(let j = y-1; j <= y+1; j ++) { 
                if(i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if(tileType == this.doorTileID || tileType == this.floorTileID) {
                        averageDepth += this.waterDepth[i][j];
                        tileCount += 1;
                    }
                }
            }
        }
        return averageDepth / tileCount;
    }

    listBoarderTiles(myData: ScanData) {
        let boarderTiles: Vector[] = [];
        for(let i = 0; i < myData.mapSize.x; i++) {
            for(let j = 0; j < myData.mapSize.y; j ++) {
                if(myData.tileMap[i][j] == this.doorTileID || myData.tileMap[i][j] == this.floorTileID) {
                    let isBoarderTile = false;
                    for(let k = i-1; k <= i+1; k ++) {
                        for(let l = j-1; l <= j+1; l ++) { 
                            if(k >= 0 && k < myData.mapSize.x && l >= 0 && l < myData.mapSize.y) {
                                if(myData.tileMap[k][l] == this.unscannedTileID) isBoarderTile = true;
                            }
                        }
                    }
                    if(isBoarderTile) boarderTiles.push(new Vector(i, j));
                }
            }
        }
        return boarderTiles;
    }
}
 
class Tobor extends Program {
    drift = new Drift();
    state = "equip";
    actionBuffer: Action[] = [];
    target = new Vector(3, 6);
    startPosition = new Vector(0, 0);
    voidPosition = new Vector(0, 0);
    destination = new Vector(0,0);
    stepCounter = 0;
    
    run(myData: ScanData) {
        var myAction = new Action();
        myData.itemMap[0][0][0].
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
                    if(this.stepCounter < 150) {
                        this.destination = this.drift.followFlow(this.voidPosition, myData);  
                    } else {
                        this.destination = this.drift.followFlow(this.startPosition, myData);
                    }
                    this.state = 'move';
                    break;
                case "move":
                    this.actionBuffer.push(new Move(this.destination));
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

class Drift {
    unscannedTile = -1;
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
        let targetTile = myData.tileMap[target.x][target.y];
        let targetList: Vector[] = [];

        // Target edge tiles if supplied target vector is invalid.
        if(target.x >= 0 && target.x < myData.mapSize.x &&
            target.y >= 0 && target.y < myData.mapSize.y &&
            (targetTile == this.doorTile || targetTile == this.floorTile)) {
                targetList.push(target);
            } else {
                targetList = this.listBoarderTiles(myData);
            }

        this.floodDungeon(targetList, myData);

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

    floodDungeon(sinkList: Vector[], myData: ScanData) {    
        this.init(myData);
        let position =myData.robots[myData.myID].pos;
        let floodCycles = 5000;
        let floodRate = 10;

        for(let cycle = 0; cycle < floodCycles; cycle ++) {
            this.depth[position.x][position.y] += floodRate;
            let tempDepth = structuredClone(this.depth);
            for(let i = 0; i < myData.mapSize.x; i ++) {
                for(let j = 0; j < myData.mapSize.y; j ++) {
                    let averageDepth = this.getAverageDepth(i, j, myData);
                    tempDepth[i][j] += 2*Math.random() * (averageDepth - this.depth[i][j]);
                }
            }
            this.depth = tempDepth;

            // Drain water at sinks.
            for(let i = 0; i < sinkList.length; i ++) {
                this.depth[sinkList[i].x][sinkList[i].y] = 0;
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

    listBoarderTiles(myData: ScanData) {
        let boarderTiles: Vector[] = [];
        for(let i = 0; i < myData.mapSize.x; i++) {
            for(let j = 0; j < myData.mapSize.y; j ++) {
                if(myData.tileMap[i][j] == this.doorTile || myData.tileMap[i][j] == this.floorTile) {
                    let isBoarderTile = false;
                    for(let k = i-1; k <= i+1; k ++) {
                        for(let l = j-1; l <= j+1; l ++) { 
                            if(k >= 0 && k < myData.mapSize.x && l >= 0 && l < myData.mapSize.y) {
                                if(myData.tileMap[k][l] == this.unscannedTile) isBoarderTile = true;
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
                        // this.destination = this.splore.getDestination(myData);
                        this.destination = this.drift.followFlow(this.voidPosition, myData);

                        
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
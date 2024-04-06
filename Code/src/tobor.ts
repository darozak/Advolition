class Splore {
    beyondTime = 10000;
    lastTransitTime: number[][] = [];
    doorValue = -1;
    initialized = false;

    constructor() {}

    init(myData: ScanData) {
        if(!this.initialized) {
            this.doorValue = myData.tiles.findLastIndex(d => d.name === 'Door');
            console.log(`Door: ${this.doorValue}`);
        }

        for(var i = 0; i < myData.mapSize.x; i ++) {
            this.lastTransitTime[i] = [];
            for(var j = 0; j < myData.mapSize.y; j ++) {
                this.lastTransitTime[i][j] = this.beyondTime;
            }
        }

    }

    isUnobstructed(myData: ScanData, target: Vector) {
        let isUnobstructed = true;
        let myPosition = myData.robots[myData.myID].pos;
        let pathToTarget = target.getPathTo(myPosition);

        for(var i = 0; i < pathToTarget.length; i ++) {
            let tileType = myData.tileMap[pathToTarget[i].x][pathToTarget[i].y];
            if (tileType >= 0 && tileType < myData.tiles.length) {
                let isTransparent = myData.tiles[tileType].transparent;
                if(!isTransparent)  isUnobstructed = false;
            } else isUnobstructed = false;
        }
        return isUnobstructed; 
    }

    getDestination(myData: ScanData) {
        this.init(myData);
        
        let targetedDoor: Vector = new Vector(0,0);
        let unobstructedDoors: Vector[] = [];

        // Update lists of known and unobstructed doors.
        for(var i = 0; i < myData.mapSize.x; i ++) {
            for(var j = 0; j < myData.mapSize.y; j ++) {
                if(myData.tileMap[i][j] == this.doorValue) {
                    let targetDoor = new Vector(i, j);
                    console.log(`Found door (${targetDoor.x}, ${targetDoor.y})`);
                    if(this.lastTransitTime[i][j] < 0) this.lastTransitTime[i][j] = this.beyondTime;
                    if(this.isUnobstructed(myData, targetDoor)) unobstructedDoors.push(targetDoor);
                }
            }
        }

        // Target unobstructed door with latest transit time.
        let highestTransitTime = 0;
        for(var i = 0; i < unobstructedDoors.length; i ++) {
            let xpos = unobstructedDoors[i].x;
            let ypos = unobstructedDoors[i].y;
            if(this.lastTransitTime[xpos][ypos] > highestTransitTime) {
                highestTransitTime = this.lastTransitTime[xpos][ypos];
                targetedDoor = unobstructedDoors[i];
            }
        }
        return targetedDoor;
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
                    let myPosition = myData.robots[myID].pos;
                    this.actionBuffer.push(new Move(this.destination));  
                    if(myPosition.x === this.destination.x && myPosition.y === this.destination.y) this.state = "scan";
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
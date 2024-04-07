"use strict";
class Splore {
    beyondTime = 10000;
    lastTransitTime = [];
    doorValue = -1;
    unscannedValue = -1;
    initialized = false;
    constructor() { }
    init(myData) {
        if (!this.initialized) {
            this.doorValue = myData.tiles.findLastIndex(d => d.name === 'Door');
            this.beyondTime = myData.gameTime + 1;
            for (var i = 0; i < myData.mapSize.x; i++) {
                this.lastTransitTime[i] = [];
                for (var j = 0; j < myData.mapSize.y; j++) {
                    this.lastTransitTime[i][j] = this.beyondTime;
                }
            }
            this.initialized = true;
        }
    }
    isUnobstructed(myData, target) {
        let isUnobstructed = true;
        let myPosition = myData.robots[myData.myID].pos;
        let pathToTarget = target.getPathTo(myPosition);
        // Add target to path.
        //pathToTarget.push(target);
        for (var i = 0; i < pathToTarget.length; i++) {
            let tileType = myData.tileMap[pathToTarget[i].x][pathToTarget[i].y];
            if (tileType >= 0 && tileType < myData.tiles.length) {
                let isTransparent = myData.tiles[tileType].transparent;
                if (!isTransparent)
                    isUnobstructed = false;
            }
            else
                isUnobstructed = false;
        }
        return isUnobstructed;
    }
    getDestination(myData) {
        this.init(myData);
        let targetedDoor = new Vector(0, 0);
        let unobstructedTargets = [];
        // Update lists of unobstructed doors and unscanned spaces.
        for (var i = 0; i < myData.mapSize.x; i++) {
            for (var j = 0; j < myData.mapSize.y; j++) {
                if (myData.tileMap[i][j] == this.doorValue || myData.tileMap[i][j] == this.unscannedValue) {
                    let targetedLocation = new Vector(i, j);
                    // if(this.lastTransitTime[i][j] < 0) this.lastTransitTime[i][j] = this.beyondTime;
                    if (this.isUnobstructed(myData, targetedLocation))
                        unobstructedTargets.push(targetedLocation);
                }
            }
        }
        // Target unobstructed door with latest transit time.
        let highestTransitTime = 0;
        if (unobstructedTargets.length > 0) {
            for (var i = 0; i < unobstructedTargets.length; i++) {
                let xpos = unobstructedTargets[i].x;
                let ypos = unobstructedTargets[i].y;
                if (this.lastTransitTime[xpos][ypos] > highestTransitTime) {
                    highestTransitTime = this.lastTransitTime[xpos][ypos];
                    targetedDoor = unobstructedTargets[i];
                }
            }
        }
        else {
            let xpos = myData.robots[myData.myID].pos.x;
            let ypos = myData.robots[myData.myID].pos.y;
            for (var i = -1; i <= 1; i++) {
                for (var j = -1; j <= 1; j++) {
                    let option = new Vector(xpos + i, ypos + j);
                    let transitTime = this.lastTransitTime[xpos + i][ypos + j];
                    let isTransparent = myData.tiles[myData.tileMap[xpos + i][ypos + j]].transparent;
                    if (isTransparent && transitTime > highestTransitTime) {
                        highestTransitTime = transitTime;
                        targetedDoor = option;
                    }
                }
            }
        }
        console.log(`Destination: ${targetedDoor.x}, ${targetedDoor.y}`);
        return targetedDoor;
    }
    markTransitTime(myData) {
        this.init(myData);
        let myPos = myData.robots[myData.myID].pos;
        this.lastTransitTime[myPos.x][myPos.y] = myData.gameTime;
    }
}
class Tobor extends Program {
    splore = new Splore();
    state = "equip";
    actionBuffer = [];
    target = new Vector(3, 6);
    destination = new Vector(0, 0);
    run(myData) {
        var myAction = new Action();
        // var destination = new Vector(1,4);
        // var destination2 = new Vector(6,3);
        var myID = myData.myID;
        this.splore.markTransitTime(myData);
        if (this.actionBuffer.length < 1) {
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

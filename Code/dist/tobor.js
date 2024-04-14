"use strict";
class Splore {
    beyondTime = 10000;
    lastTransitTime = [];
    doorValue = -1;
    floorValue = -1;
    unscannedValue = -1;
    initialized = false;
    constructor() { }
    init(myData) {
        if (!this.initialized) {
            this.doorValue = myData.tiles.findLastIndex(d => d.name === 'Door');
            this.floorValue = myData.tiles.findLastIndex(d => d.name === 'Floor');
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
    isUnobstructed(target, myData) {
        let isUnobstructed = true;
        let myPosition = new Vector(0, 0);
        myPosition = myPosition.add(myData.robots[myData.myID].pos);
        let pathToTarget = myPosition.getPathTo(target);
        // Allows robot to explore options around corners.
        if (pathToTarget.length > 2) {
            pathToTarget.pop();
            pathToTarget.pop();
        }
        for (var i = 0; i < pathToTarget.length; i++) {
            let tileType = myData.tileMap[pathToTarget[i].x][pathToTarget[i].y];
            if (tileType >= 0 && tileType < myData.tiles.length) {
                let isTransparent = myData.tiles[tileType].transparent;
                if (!isTransparent && tileType != this.doorValue)
                    isUnobstructed = false;
            }
        }
        return isUnobstructed;
    }
    findAccessibleTile(targetedTileType, mustBeNearUnscannedTile, currentDestination, myData) {
        let unobstructedTargets = [];
        let myPosition = myData.robots[myData.myID].pos;
        // Find all unobstructed tiles.
        for (var i = 0; i < myData.mapSize.x; i++) {
            for (var j = 0; j < myData.mapSize.y; j++) {
                if ((i != myPosition.x || j != myPosition.y) && myData.tileMap[i][j] == targetedTileType) {
                    let targetedLocation = new Vector(i, j);
                    let isNearUnscannedTile = true;
                    let maxRangeToUnscannedTile = 1;
                    if (mustBeNearUnscannedTile) {
                        isNearUnscannedTile = this.isNearUnscannedTile(targetedLocation, maxRangeToUnscannedTile, myData);
                    }
                    else
                        isNearUnscannedTile = true;
                    if (isNearUnscannedTile && this.isUnobstructed(targetedLocation, myData))
                        unobstructedTargets.push(targetedLocation);
                }
            }
        }
        // Select tile that I never visited be for or that I visited a long time ago.
        let highestTransitTime = 0;
        if (unobstructedTargets.length > 0) {
            for (var i = 0; i < unobstructedTargets.length; i++) {
                let xpos = unobstructedTargets[i].x;
                let ypos = unobstructedTargets[i].y;
                if (this.lastTransitTime[xpos][ypos] > highestTransitTime) {
                    highestTransitTime = this.lastTransitTime[xpos][ypos];
                    currentDestination.setEqualTo(unobstructedTargets[i]);
                }
            }
        }
    }
    isNearUnscannedTile(target, range, myData) {
        let isNearUnscannedTile = false;
        for (var i = target.x - range; i <= target.x + range; i++) {
            for (var j = target.y - range; j <= target.y + range; j++) {
                if (i >= 0 && i < myData.mapSize.x && j >= 0 && j < myData.mapSize.y) {
                    let tileType = myData.tileMap[i][j];
                    if (tileType < 0)
                        isNearUnscannedTile = true;
                }
            }
        }
        return isNearUnscannedTile;
    }
    getDestination(myData) {
        this.init(myData);
        let destination = new Vector(0, 0);
        this.findAccessibleTile(this.floorValue, false, destination, myData);
        this.findAccessibleTile(this.doorValue, false, destination, myData);
        this.findAccessibleTile(this.floorValue, true, destination, myData);
        return destination;
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
                    this.actionBuffer.push(new Move(this.destination));
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

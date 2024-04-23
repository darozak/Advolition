"use strict";
class Arena {
    world;
    mask = [];
    scans = [];
    tileMap = [];
    itemMap = [];
    robotMap = [];
    robots = [];
    fov = new PreciseShadowcasting();
    constructor(world, robots) {
        this.world = world;
        this.robots = robots;
        this.world.size.x = 25;
        this.world.size.y = 25;
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.scans[i] = [];
            this.tileMap[i] = [];
            this.itemMap[i] = [];
            this.robotMap[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                this.mask[i][j] = false;
                this.scans[i][j] = -1;
                this.tileMap[i][j] = -1;
                this.itemMap[i][j] = [];
                this.robotMap[i][j] = -1;
            }
        }
    }
    generateMap() {
        var x = this.world.size.x, y = this.world.size.y;
        var map = new Digger(x, y);
        var sketch = [];
        for (var i = 0; i < x; i++) {
            sketch[i] = [];
            for (var j = 0; j < y; j++) {
                sketch[i][j] = '.';
            }
        }
        var display = function (x, y, wall) { sketch[x][y] = wall ? "#" : "."; };
        map.create(display);
        // Place doors
        var drawDoor = function (x, y) {
            sketch[x][y] = '+';
        };
        var rooms = map.getRooms();
        for (var i = 0; i < rooms.length; i++) {
            var room = rooms[i];
            room.getDoors(drawDoor);
        }
        // Use sketch to populate mask and tile arrays.
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.tileMap[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                let tileID = this.world.tiles.findLastIndex(d => d.key === sketch[i][j]);
                this.mask[i][j] = this.world.tiles[tileID].transparent;
                this.tileMap[i][j] = tileID;
            }
        }
        // Place items
        let totalItems = 1;
        for (var i = 0; i < totalItems; i++) {
            let x = 0;
            let y = 0;
            let keepLooking = true;
            // Find a random floor tile to place the item.
            while (keepLooking) {
                x = rng.getUniformInt(0, this.world.size.x - 1);
                y = rng.getUniformInt(0, this.world.size.y - 1);
                let tileID = this.tileMap[x][y];
                if (tileID >= 0) {
                    keepLooking = this.world.tiles[tileID].key != '.';
                    console.log(tileID);
                }
            }
            // Place a random item at this location.
            let item = (rng.getUniformInt(0, this.world.items.length - 1));
            this.itemMap[x][y].push(structuredClone(this.world.items[i]));
        }
    }
    placeRobot() {
        var x = 0;
        var y = 0;
        while (this.world.tiles[this.tileMap[x][y]].key != '.') {
            x = rng.getUniformInt(0, this.world.size.x - 1);
            y = rng.getUniformInt(0, this.world.size.y - 1);
        }
        return new Vector(x, y);
    }
    scan(pov, scanRadius, scan, scanTime) {
        var visible = this.fov.compute(pov.x, pov.y, scanRadius, this.mask);
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                if (visible[i][j] > 0) {
                    scan.scanTime[i][j] = scanTime;
                    scan.tileMap[i][j] = this.tileMap[i][j];
                    scan.itemMap[i][j] = this.itemMap[i][j];
                    scan.robotMap[i][j] = this.robotMap[i][j];
                    if (this.robotMap[i][j] >= 0) {
                        scan.robots[this.robotMap[i][j]] = structuredClone(this.robots[this.robotMap[i][j]]);
                        scan.robots[this.robotMap[i][j]].lastScan = scanTime;
                    }
                }
            }
        }
        // Erase self from robot scan.
        scan.robotMap[pov.x][pov.y] = -1;
        return scan;
    }
    getTileSpeed(pos) {
        return this.world.tiles[this.tileMap[pos.x][pos.y]].speed;
    }
    toggleDoor(target) {
        let tileID = this.tileMap[target.x][target.y];
        switch (this.world.tiles[tileID].name) {
            case "Closed Door":
                let openDoorID = this.world.tiles.findLastIndex(d => d.name === "Open Door");
                this.tileMap[target.x][target.y] = openDoorID;
                this.mask[target.x][target.y] = true;
                break;
            case "Open Door":
                let closedDoorID = this.world.tiles.findLastIndex(d => d.name === "Closed Door");
                this.tileMap[target.x][target.y] = closedDoorID;
                this.mask[target.x][target.y] = false;
                break;
        }
    }
}

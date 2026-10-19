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
    constructor(world) {
        this.world = world;
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
        for (var i = 0; i < this.world.startingItems; i++)
            this.spawnItem();
    }
    // Places a random item on a random floor tile (never on a nest).
    spawnItem() {
        let x = 0;
        let y = 0;
        while (this.world.tiles[this.tileMap[x][y]].key != '.') {
            x = rng.getUniformInt(0, this.world.size.x - 1);
            y = rng.getUniformInt(0, this.world.size.y - 1);
        }
        let item = rng.getUniformInt(0, this.world.items.length - 1);
        this.itemMap[x][y].push(structuredClone(this.world.items[item]));
        return new Vector(x, y);
    }
    // Walking distance (in steps) from one tile to every other tile.
    walkingDistances(from) {
        let size = this.world.size;
        let distance = [];
        for (let i = 0; i < size.x; i++)
            distance[i] = new Array(size.y).fill(Infinity);
        distance[from.x][from.y] = 0;
        let queue = [from];
        for (let k = 0; k < queue.length; k++) {
            let here = queue[k];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    let x = here.x + dx, y = here.y + dy;
                    if (x < 0 || y < 0 || x >= size.x || y >= size.y)
                        continue;
                    if (this.world.tiles[this.tileMap[x][y]].key == '#')
                        continue;
                    if (distance[x][y] > distance[here.x][here.y] + 1) {
                        distance[x][y] = distance[here.x][here.y] + 1;
                        queue.push(new Vector(x, y));
                    }
                }
            }
        }
        return distance;
    }
    placeRobot(robotID) {
        var x = 0;
        var y = 0;
        if (this.robots.length > robotID) {
            // Candidates are empty floor tiles, so no items start on a nest.
            let candidates = [];
            for (let i = 0; i < this.world.size.x; i++) {
                for (let j = 0; j < this.world.size.y; j++) {
                    if (this.world.tiles[this.tileMap[i][j]].key == '.' && this.itemMap[i][j].length == 0) {
                        candidates.push(new Vector(i, j));
                    }
                }
            }
            // Score each candidate by its walking distance to the nearest
            // existing nest, and note whether any existing nest can see it.
            let nests = this.robots.slice(0, robotID).map(r => r.nest);
            let nearest = candidates.map(() => Infinity);
            let seen = candidates.map(() => false);
            nests.forEach(nest => {
                let distance = this.walkingDistances(nest);
                let visible = this.fov.compute(nest.x, nest.y, this.world.size.x + this.world.size.y, this.mask);
                candidates.forEach((c, k) => {
                    nearest[k] = Math.min(nearest[k], distance[c.x][c.y]);
                    if (visible[c.x][c.y] > 0)
                        seen[k] = true;
                });
            });
            // Prefer tiles no other nest can see, then pick at random among
            // those at least 75% as far away as the farthest one.
            let hidden = candidates.map((c, k) => k).filter(k => !seen[k]);
            let pool = hidden.length > 0 ? hidden : candidates.map((c, k) => k);
            let reachable = pool.filter(k => nearest[k] < Infinity);
            if (reachable.length > 0)
                pool = reachable;
            let farthest = Math.max(...pool.map(k => nearest[k]));
            if (farthest < Infinity)
                pool = pool.filter(k => nearest[k] >= 0.75 * farthest);
            let pick = candidates[pool[rng.getUniformInt(0, pool.length - 1)]];
            x = pick.x;
            y = pick.y;
            this.robots[robotID].nest.x = x;
            this.robots[robotID].nest.y = y;
            let tileID = this.world.tiles.findLastIndex(d => d.key === '@');
            this.tileMap[x][y] = tileID;
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
                    scan.itemMap[i][j] = structuredClone(this.itemMap[i][j]);
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
    getScore(robotID) {
        let score = 0;
        let nest = this.robots[robotID].nest;
        // Add the robot's own worth if it is home. Other robots on the nest don't count.
        if (this.robotMap[nest.x][nest.y] == robotID) {
            score += this.robots[robotID].stats.worth;
        }
        // Add worth of local items
        let itemCount = this.itemMap[nest.x][nest.y].length;
        for (let i = 0; i < itemCount; i++) {
            score += this.itemMap[nest.x][nest.y][i].stats.worth;
        }
        return score;
    }
}

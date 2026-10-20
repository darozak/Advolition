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
    /**
     * Chooses a nest for every robot at once, then hands them out in a random
     * order, so no seat gets a better spot than another. Called each time a
     * robot is added, before the game starts.
     *
     * Nests go on empty floor tiles, out of each other's line of sight where
     * possible, and as far apart (by walking distance) as possible: of many
     * randomly started layouts, it keeps the one whose two closest nests are
     * farthest apart.
     */
    placeNests() {
        const nestTile = this.world.tiles.findLastIndex(d => d.key === '@');
        const floorTile = this.world.tiles.findLastIndex(d => d.key === '.');
        // Undo any earlier placement.
        this.robots.forEach((robot, i) => {
            if (this.tileMap[robot.nest.x][robot.nest.y] == nestTile)
                this.tileMap[robot.nest.x][robot.nest.y] = floorTile;
            if (this.robotMap[robot.pos.x][robot.pos.y] == i)
                this.robotMap[robot.pos.x][robot.pos.y] = -1;
        });
        // Candidates are empty floor tiles, so no items start on a nest.
        let candidates = [];
        for (let x = 0; x < this.world.size.x; x++) {
            for (let y = 0; y < this.world.size.y; y++) {
                if (this.tileMap[x][y] == floorTile && this.itemMap[x][y].length == 0)
                    candidates.push(new Vector(x, y));
            }
        }
        const distance = candidates.map(c => this.walkingDistances(c));
        const range = this.world.size.x + this.world.size.y;
        const visible = candidates.map(c => this.fov.compute(c.x, c.y, range, this.mask));
        const steps = (a, b) => distance[a][candidates[b].x][candidates[b].y];
        const sees = (a, b) => visible[a][candidates[b].x][candidates[b].y] > 0;
        let best = [];
        let bestScore = -Infinity;
        for (let trial = 0; trial < 200; trial++) {
            // Start from a random tile, then keep adding a tile that is out of
            // sight of the chosen ones and far from all of them.
            let chosen = [rng.getUniformInt(0, candidates.length - 1)];
            while (chosen.length < this.robots.length) {
                let options = candidates.map((c, k) => k).filter(k => !chosen.includes(k));
                let nearest = (k) => Math.min(...chosen.map(j => steps(j, k)));
                let hidden = options.filter(k => !chosen.some(j => sees(j, k)));
                if (hidden.length > 0)
                    options = hidden;
                let reachable = options.filter(k => nearest(k) < Infinity);
                if (reachable.length > 0)
                    options = reachable;
                let farthest = Math.max(...options.map(nearest));
                if (farthest < Infinity)
                    options = options.filter(k => nearest(k) >= 0.9 * farthest);
                chosen.push(options[rng.getUniformInt(0, options.length - 1)]);
            }
            // Score the layout: no nest may see another, then the closest pair
            // should be as far apart as possible, then the total spread.
            let closest = Infinity, total = 0, seen = false;
            for (let a = 0; a < chosen.length; a++) {
                for (let b = a + 1; b < chosen.length; b++) {
                    let d = steps(chosen[a], chosen[b]);
                    closest = Math.min(closest, d);
                    total += Math.min(d, 1000);
                    if (sees(chosen[a], chosen[b]))
                        seen = true;
                }
            }
            let score = (seen ? -1e9 : 0) + Math.min(closest, 1000) * 1e4 + total;
            if (score > bestScore) {
                bestScore = score;
                best = chosen;
            }
        }
        // Hand the nests out in a random order.
        for (let i = best.length - 1; i > 0; i--) {
            let j = rng.getUniformInt(0, i);
            [best[i], best[j]] = [best[j], best[i]];
        }
        this.robots.forEach((robot, i) => {
            let spot = candidates[best[i]];
            robot.nest = new Vector(spot.x, spot.y);
            robot.pos = new Vector(spot.x, spot.y);
            this.tileMap[spot.x][spot.y] = nestTile;
            this.robotMap[spot.x][spot.y] = i;
        });
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
                        scan.robots[this.robotMap[i][j]] = this.publicView(this.robots[this.robotMap[i][j]]);
                        scan.robots[this.robotMap[i][j]].lastScan = scanTime;
                    }
                }
            }
        }
        // Erase self from robot scan.
        scan.robotMap[pov.x][pov.y] = -1;
        return scan;
    }
    // What a scan reveals about another robot: everything except its private
    // log, lastAction and lastHit (those fields are left empty).
    publicView(robot) {
        let view = structuredClone(robot);
        view.logTime = [];
        view.logEntry = [];
        view.logRepeat = [];
        view.lastAction = null;
        view.lastHit = null;
        return view;
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

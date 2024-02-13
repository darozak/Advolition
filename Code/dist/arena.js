"use strict";
/**
 * This class manages a layered map grid with information on scan times, tiles,
 * and NPCs for each x, y position.
 */
class Arena {
    world;
    mask = [];
    scans = [];
    tileMap = [];
    robotMap = [];
    robots = [];
    fov = new PreciseShadowcasting();
    constructor(world, robots) {
        this.world = world;
        this.robots = robots;
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.scans[i] = [];
            this.tileMap[i] = [];
            this.robotMap[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                this.mask[i][j] = false;
                this.scans[i][j] = -1;
                this.tileMap[i][j] = -1;
                this.robotMap[i][j] = -1;
            }
        }
    }
    generate() {
        // Make sure world size matches sketch.
        this.world.size.x = this.world.sketch.length;
        this.world.size.y = this.world.sketch[0].length;
        // Use sketch to populate mask and tile arrays.
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.tileMap[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                let tileID = this.world.tiles.findLastIndex(d => d.key === this.world.sketch[i][j]);
                this.mask[i][j] = this.world.tiles[tileID].transparent;
                this.tileMap[i][j] = tileID;
            }
        }
    }
    scan(pov, scanRadius, scan, scanTime) {
        var visible = this.fov.compute(pov.x, pov.y, scanRadius, this.mask);
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                if (visible[i][j] > 0) {
                    scan.scanTime[i][j] = scanTime;
                    // scan.visible[i][j] = visible[i][j];
                    scan.tileMap[i][j] = this.tileMap[i][j];
                    scan.robotMap[i][j] = this.robotMap[i][j];
                    if (this.robotMap[i][j] >= 0) {
                        scan.robots[this.robotMap[i][j]] = structuredClone(this.robots[this.robotMap[i][j]]);
                    }
                }
            }
        }
        // Erase self from robot scan.
        scan.robotMap[pov.x][pov.y] = -1;
        return scan;
    }
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.world.tiles.findLastIndex(d => d.key === this.world.sketch[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.world.tiles[this.getTileID(pos)].speed;
    }
}

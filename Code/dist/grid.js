"use strict";
/**
 * This class manages a layered map grid with information on scan times, tiles,
 * and NPCs for each x, y position.
 */
class Grid {
    world;
    mask;
    scans;
    tiles;
    npcs;
    fov = new PreciseShadowcasting();
    /**
     * Creates a layerd map grid of the indicated size.
     * @param size
     */
    constructor(world) {
        this.world = world;
        this.mask = [];
        this.scans = [];
        this.tiles = [];
        this.npcs = [];
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.scans[i] = [];
            this.tiles[i] = [];
            this.npcs[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                this.mask[i][j] = false;
                this.scans[i][j] = 0;
                this.tiles[i][j] = 0;
                this.npcs[i][j] = 0;
            }
        }
    }
    generate() {
        // Create a light mask from the sketch.
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                this.mask[i][j] = this.world.sketch[i][j] === ".";
            }
        }
    }
    populate() { }
    scan(pov, scanRadius, targetGrid) {
        var visible = this.fov.compute(pov.x, pov.y, scanRadius, targetGrid.mask);
        console.log(visible);
        return visible;
    }
    get enter() { return this.world.entrance; }
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.world.tiles.findLastIndex(d => d.key === this.world.sketch[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.world.tiles[this.getTileID(pos)].speed;
    }
}

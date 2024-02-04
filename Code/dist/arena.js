"use strict";
/**
 * This class manages a layered map grid with information on scan times, tiles,
 * and NPCs for each x, y position.
 */
class Arena {
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
        // Make sure world size matches sketch.
        this.world.size.x = this.world.sketch.length;
        this.world.size.y = this.world.sketch[0].length;
        // Use scetch to populate mask and tile arrays.
        for (var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.tiles[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                this.mask[i][j] = this.world.sketch[i][j] === ".";
                this.tiles[i][j] =
                    this.world.tiles.findLastIndex(d => d.key === this.world.sketch[i][j]);
            }
        }
    }
    populate() { }
    /**
     * Scans the map based on the specified point of view (pov) and scan radius.
     * @param pov A 2D vector indicating the center of the scan.
     * @param scanRadius  An integer radius of the scan.
     * @returns Returns a packaged set of 2D scan layers. One layer maps the scanned tiles
     * and the other layer maps the NPCs.  Unscanned regions of the grid are indicated
     * by a -1.
     */
    scan(pov, scanRadius) {
        var visible = this.fov.compute(pov.x, pov.y, scanRadius, this.mask);
        var scan = new Scan(this.world.size);
        // var tiles: number[][] = []
        // var npcs: number[][] = []
        // var output = {tiles: tiles, npcs: npcs}
        for (var i = 0; i < this.world.size.x; i++) {
            // this.scan.tiles[i] = [];
            // npcs[i] = [];
            for (var j = 0; j < this.world.size.y; j++) {
                if (visible[i][j] > 0) {
                    scan.visible[i][j] = visible[i][j];
                    scan.tiles[i][j] = this.tiles[i][j];
                    scan.npcs[i][j] = this.npcs[i][j];
                }
                else {
                    scan.visible[i][j] = 0;
                    scan.tiles[i][j] = -1;
                    scan.npcs[i][j] = -1;
                }
            }
        }
        // console.log(output);
        return scan;
    }
    // get enter() {return this.world.entrances}
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.world.tiles.findLastIndex(d => d.key === this.world.sketch[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.world.tiles[this.getTileID(pos)].speed;
    }
}

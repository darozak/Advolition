"use strict";
class Dungeon {
    #world;
    sketch = [
        "#####",
        "#...#",
        "#.###",
        "#...#",
        "#####"
    ];
    // visible: number[][];
    #map;
    mask;
    fov = new PreciseShadowcasting();
    #enter = new Vector(3, 3);
    constructor(world, size) {
        this.#world = world;
        this.#map = [];
        // this.visible = [];
        this.mask = [];
        // Create a light mask from the sketch.
        for (var i = 0; i < 5; i++) {
            this.mask[i] = [];
            for (var j = 0; j < 5; j++) {
                this.mask[i][j] = this.sketch[i][j] === ".";
            }
        }
    }
    get enter() { return this.#enter; }
    getTile(pos) {
        return this.#map[pos.x][pos.y].feature;
    }
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.#world.tiles.findLastIndex(d => d.key === this.sketch[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }
    scan() {
        var visible = this.fov.compute(1, 1, 5, this.mask);
        console.log(visible);
        return visible;
    }
}

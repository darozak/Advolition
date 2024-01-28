"use strict";
class Dungeon {
    #world;
    #sketch = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];
    #map;
    #enter = new Vector(3, 3);
    constructor(world, size) {
        this.#world = world;
        this.#map = [];
        // Create map from sketch.
        for (var i = 0; i < this.#sketch.length; i++) {
            this.#map[i] = [];
            for (var j = 0; j < this.#sketch[i].length; j++) {
                this.#map[i][j] =
                    new Tile(this.#world.tiles.findLastIndex(d => d.key === this.#sketch[i][j]));
            }
        }
    }
    get enter() { return this.#enter; }
    getTile(pos) {
        return this.#map[pos.x][pos.y].feature;
    }
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.#world.tiles.findLastIndex(d => d.key === this.#sketch[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }
}

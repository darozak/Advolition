"use strict";
class Dungeon {
    #world;
    #map = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];
    #enter = new Vector(3, 3);
    constructor(world) {
        this.#world = world;
    }
    get enter() { return this.#enter; }
    getTile(pos) {
        return this.#map[pos.x][pos.y];
    }
    // Returns the index value of the object occupying location x, y.
    getTileID(pos) {
        return this.#world.tiles.findLastIndex(d => d.key === this.#map[pos.x][pos.y]);
    }
    getTileSpeed(pos) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }
}

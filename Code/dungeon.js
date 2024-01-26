class Dungeon {

    #data = null;
    #map = null;

    constructor(data) {
        this.#data = data;
        this.#map = data.cards[0].map;
        console.log("Dungeon constructed");
        console.log(this.#data.tiles[0].name);
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(x, y) {
        return this.#data.tiles.findLastIndex(d => d.key === this.#map[x][y]);
    }

    getTileSpeed(x, y) {
        return this.#data.tiles[0].speed;
    }
  }
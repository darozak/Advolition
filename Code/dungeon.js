class Dungeon {

    #data = null;
    #map = null;

    constructor(data) {
        this.#data = data;
        this.#map = data.tiles[0].map;
        console.log("Dungeon constructed");
        console.log(this.#data.objects[0].name);
    }

    // Returns the index value of the object occupying location x, y.
    getObject(x, y) {
        return this.#data.objects.findLastIndex(d => d.key === this.#map[x][y]);
    }
  }
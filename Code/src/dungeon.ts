class Dungeon {

    #data: Data;
    #map: string[] = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];

    constructor(data: Data) {
        this.#data = data;
        console.log("Dungeon constructed");
        console.log(this.#data.tiles[0].name);
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(x: number, y: number) {        
        return this.#data.tiles.findLastIndex(d => d.key === this.#map[x][y]);
    }

    getTileSpeed(x: number, y: number) {
        return this.#data.tiles[0].speed;
    }
  }
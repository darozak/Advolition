class Dungeon {

    #data: Data;
    #map: string[] = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];
    #enter = new Vector(3,3);

    constructor(data: Data) {
        this.#data = data;
        console.log("Dungeon constructed");
        console.log(this.#data.tiles[0].name);
    }

    get enter() {return this.#enter}

    

    getTile(pos: Vector) {
        return this.#map[pos.x][pos.y];
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(pos: Vector) {    
        console.log(this.#map[pos.x][pos.y]);    
        return this.#data.tiles.findLastIndex(d => d.key === this.#map[pos.x][pos.y]);
    }

    getTileSpeed(pos: Vector) {
        return this.#data.tiles[this.getTileID(pos)].speed;
    }
  }
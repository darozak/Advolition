class Dungeon {

    #world: World;
    #map: string[] = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];
    #enter = new Vector(3,3);

    constructor(world: World) {
        this.#world = world;
        console.log("Dungeon constructed");
        console.log(this.#world.tiles[0].name);
    }

    get enter() {return this.#enter}

    

    getTile(pos: Vector) {
        return this.#map[pos.x][pos.y];
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(pos: Vector) {    
        console.log(this.#map[pos.x][pos.y]);    
        return this.#world.tiles.findLastIndex(d => d.key === this.#map[pos.x][pos.y]);
    }

    getTileSpeed(pos: Vector) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }
  }
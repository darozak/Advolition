class Dungeon {

    #world: World;
    #sketch: string[] = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ]; 

    #map: Tile[][];
    
    #enter = new Vector(3,3);

    constructor(world: World, size: number) {
        this.#world = world;
        this.#map = [];

        // Create map from sketch.
        for(var i = 0; i < this.#sketch.length; i++) {
            this.#map[i] = [];
            for(var j = 0; j < this.#sketch[i].length; j++) {
                this.#map[i][j] = 
                new Tile(this.#world.tiles.findLastIndex(d => d.key === this.#sketch[i][j]));
            }
        }
    }

    get enter() {return this.#enter}

    getTile(pos: Vector) {
        return this.#map[pos.x][pos.y].feature;
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(pos: Vector) {       
        return this.#world.tiles.findLastIndex(d => d.key === this.#sketch[pos.x][pos.y]);
    }

    getTileSpeed(pos: Vector) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }
  }
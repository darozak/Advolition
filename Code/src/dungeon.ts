class Dungeon {

    #world: World;
    sketch: string[] = [
        "#####",
        "#...#",
        "#.###",
        "#...#",
        "#####"
    ]; 

    visible: number[][];
    #map: Tile[][];
    mask: boolean[][];
    
    #enter = new Vector(3,3);

    constructor(world: World, size: number) {
        this.#world = world;
        this.#map = [];
        this.visible = [];
        this.mask = [];

        // Create a light mask from the sketch.
        for(var i = 0; i < 5; i++) {
            this.mask[i] = [];
            for(var j = 0; j < 5; j++) {
                this.mask[i][j] = this.sketch[i][j]===".";
            }
        }
    }

    get enter() {return this.#enter}

    getTile(pos: Vector) {
        return this.#map[pos.x][pos.y].feature;
    }

    // Returns the index value of the object occupying location x, y.
    getTileID(pos: Vector) {       
        return this.#world.tiles.findLastIndex(d => d.key === this.sketch[pos.x][pos.y]);
    }

    getTileSpeed(pos: Vector) {
        return this.#world.tiles[this.getTileID(pos)].speed;
    }

    render() {
        var visible: number[][];
        visible=[
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0],
            [0,0,0,0,0]
        ];
        
        var fov = new PreciseShadowcasting();
        fov.compute(1, 1, 5, this.mask, function(x, y, r, visibility) {
            if(x >= 0 && x <= 4 && y >= 0 && y <= 4) {
                 visible[x][y]=visibility;
            }
        });
        console.log(visible);
        return visible;
    }
}

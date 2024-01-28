"use strict";
class Dungeon {
    #world;
    sketch = [
        "#####",
        "#...#",
        "#...#",
        "#...#",
        "#####"
    ];
    visible;
    #map;
    #enter = new Vector(3, 3);
    constructor(world, size) {
        this.#world = world;
        this.#map = [];
        this.visible = [];
        // Create map from sketch.
        for (var i = 0; i < this.sketch.length; i++) {
            this.#map[i] = [];
            this.visible[i] = [];
            for (var j = 0; j < this.sketch[i].length; j++) {
                this.visible[i][j] = 0;
                this.#map[i][j] =
                    new Tile(this.#world.tiles.findLastIndex(d => d.key === this.sketch[i][j]));
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
    /* input callback */
    // lightPasses(x: number, y: number) {
    //     var key = x+","+y;
    //     if (key in data) { return (data[key] == 0); }
    //     return false;
    // }
    lightPasses(x, y) {
        var sketch = [
            "#####",
            "#...#",
            "#..##",
            "#...#",
            "#####"
        ];
        return sketch[x][y] === ".";
        // return true;
    }
    /* output callback */
    // render() {
    //     var fov = new PreciseShadowcasting(this.lightPasses);
    //     fov.compute(50, 22, 10, function(x, y, r, visibility) {
    //         var ch = (r ? "" : "@");
    //         var color = (data[x+","+y] ? "#aa0": "#660");
    //         display.draw(x, y, ch, "#fff", color);
    //     });
    // }
    // toVisible(x:number, y:number, visibility: number) {
    //     this.visible[x][y] = visibility;
    // }
    render() {
        var visible;
        visible = [
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0]
        ];
        // for(var i = 0; i < 5; i++) {
        //     this.visible[i] = [];
        //     for(var j = 0; j < 5; j++) {
        //         visible[i][j] = 0;
        //     }
        // }
        var fov = new PreciseShadowcasting(this.lightPasses);
        fov.compute(3, 3, 1, function (x, y, r, visibility) {
            visible[x][y] = visibility;
        });
        console.log(visible);
        return visible;
    }
}

class Scan {

    visible: number[][];
    tiles: number[][];
    npcs: number[][];

    constructor(size: Vector) {
        this.visible = [];
        this.tiles = [];
        this.npcs = [];
        for(var i = 0; i < size.x; i++) {
            this.visible[i] = [];
            this.tiles[i] = [];
            this.npcs[i] = [];

            for(var j = 0; j < size.y; j++) {
                this.visible[i][j] = -1;
                this.tiles[i][j] = -1;
                this.npcs[i][j] = -1;
            }
        }
    }
}
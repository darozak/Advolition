class Scan {

    visible: number[][];
    tiles: number[][];
    robots: number[][];

    constructor(size: Vector) {
        this.visible = [];
        this.tiles = [];
        this.robots = [];
        for(var i = 0; i < size.x; i++) {
            this.visible[i] = [];
            this.tiles[i] = [];
            this.robots[i] = [];

            for(var j = 0; j < size.y; j++) {
                this.visible[i][j] = -1;
                this.tiles[i][j] = -1;
                this.robots[i][j] = -1;
            }
        }
    }
}
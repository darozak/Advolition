/**
 * This class manages a layered map grid with information on scan times, tiles,
 * and NPCs for each x, y position.
 */
class Grid {
    size: Vector;
    scans: number[][];
    tiles: number[][];
    npcs: number[][];

    /**
     * Creates a layerd map grid of the indicated size.
     * @param size 
     */
    constructor(size: Vector) {
        this.size = size;
        this.scans = [];
        this.tiles = [];
        this.npcs = [];
        for(var i = 0; i < this.size.x; i ++) {
            this.scans[i] = [];
            this.tiles[i] = [];
            this.npcs[i] = [];
            for(var j = 0; j < this.size.y; j ++) {
                this.scans[i][j] = 0;
                this.tiles[i][j] = 0;
                this.npcs[i][j] = 0;
            }
        }
    }
}
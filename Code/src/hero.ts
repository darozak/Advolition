/**
 * This class handles all the information about the hero character.
 */
class Hero {
    time: number = 0;
    pos: Vector;
    targ: Vector;
    isMoving: boolean;
    isScanning: boolean;
    grid: Grid;

    /**
     * Creates a hero for the given world size.
     * @param worldSize 
     */
    constructor(world: World) {
        this.time = 0;
        this.pos = new Vector(0,0); 
        this.targ = new Vector(0,0);
        this.grid = new Grid(world);
        this.isMoving = false;
        this.isScanning = false;
    }
}
/**
 * This class handles all the information about the hero character.
 */
class Hero {
    time: number = 0;
    pos: Vector;
    targ: Vector;
    isMoving: boolean;
    isScanning: boolean;
    scan: any;

    /**
     * Creates a hero for the given world size.
     * @param worldSize 
     */
    constructor(world: World) {
        this.time = 0;
        this.pos = new Vector(0,0); 
        this.targ = new Vector(0,0);
        this.scan = [];
        this.isMoving = false;
        this.isScanning = false;
    }
}
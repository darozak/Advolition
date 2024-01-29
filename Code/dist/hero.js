"use strict";
/**
 * This class handles all the information about the hero character.
 */
class Hero {
    time = 0;
    pos;
    targ;
    isMoving;
    isScanning;
    grid;
    /**
     * Creates a hero for the given world size.
     * @param worldSize
     */
    constructor(worldSize) {
        this.time = 0;
        this.pos = new Vector(0, 0);
        this.targ = new Vector(0, 0);
        this.grid = new Grid(worldSize);
        this.isMoving = false;
        this.isScanning = false;
    }
}

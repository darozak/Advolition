"use strict";
class Status {
    world;
    pos;
    targ;
    isMoving;
    isScanning;
    scan;
    sprite;
    name;
    constructor(world, name) {
        this.world = world;
        this.name = name;
        this.pos = new Vector(1, 1);
        this.targ = new Vector(0, 0);
        this.scan = new Scan(world.size);
        this.sprite = new Vector(16, 3);
        this.isMoving = false;
        this.isScanning = false;
    }
}

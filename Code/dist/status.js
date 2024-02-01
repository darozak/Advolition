"use strict";
class Status {
    time = 0;
    pos;
    targ;
    isMoving;
    isScanning;
    scan;
    constructor() {
        this.time = 0;
        this.pos = new Vector(1, 1);
        this.targ = new Vector(0, 0);
        this.scan = [];
        this.isMoving = false;
        this.isScanning = false;
    }
}

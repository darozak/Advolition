
class Status {
    time: number = 0;
    pos: Vector;
    targ: Vector;
    isMoving: boolean;
    isScanning: boolean;
    scan: any;

    constructor() {
        this.time = 0;
        this.pos = new Vector(1,1); 
        this.targ = new Vector(0,0);
        this.scan = [];
        this.isMoving = false;
        this.isScanning = false;
    }
}
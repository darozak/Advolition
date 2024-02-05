
class Status {

    name: string;
    world: World;
    pos: Vector;
    scan: Scan; 
    model: Model;

    currentPower: number;
    currentHps: number;

    // Equipped eqipment
    core: Core;
    scanner: Scanner;

    constructor(world: World, robotID: number, name: string) {
        this.world = world;
        this.name = name;
        this.scan = new Scan(world.size);
        this.model = world.model[0];
        this.currentPower = this.model.maxPower;
        this.currentHps = this.model.maxHps;
        this.pos = world.entrances[robotID];

        // Equip race's equipment
        this.scanner = this.model.scanner;
        this.core = this.model.core;
    }
}
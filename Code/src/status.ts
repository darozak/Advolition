
class Status {

    name: string;
    world: World;
    pos: Vector;
    scan: Scan; 
    model: Model;

    // Equipped eqipment
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;

    constructor(world: World, robotID: number, name: string) {
        this.world = world;
        this.name = name;
        this.scan = new Scan(world.size);
        this.model = this.world.model[0];
        this.pos = world.entrances[robotID];

        // Equip model's equipment
        this.scanner = this.model.scanner;      
        this.core = this.model.core;
        this.battery = this.model.battery.clone();
        this.chassis = this.model.chassis.clone();
    }
}
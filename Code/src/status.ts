
class Status {

    name: string;
    world: World;
    pos: Vector;
    scan: Scan; 
    race: Race;

    currentPower: number;
    currentHps: number;

    // Equipped eqipment
    core: Core;
    scanner: Scanner;

    constructor(world: World, robotID: number, name: string) {
        this.world = world;
        this.name = name;
        this.scan = new Scan(world.size);
        this.race = world.races[0];
        this.currentPower = this.race.maxPower;
        this.currentHps = this.race.maxHps;
        this.pos = world.entrances[robotID];

        // Equip race's equipment
        this.scanner = this.race.scanner;
        this.core = this.race.core;
    }
}
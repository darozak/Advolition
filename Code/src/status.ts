
class Status {
    world: World;
    pos: Vector;
    targ: Vector;
    scan: Scan;
    name: string;
    race: Race;
    currentPower: number;
    currentHps: number;

    constructor(world: World, robotID: number, name: string) {
        this.world = world;
        this.name = name;
        this.pos = new Vector(1,1); 
        this.targ = new Vector(0,0);
        this.scan = new Scan(world.size);
        this.race = world.races[0];
        this.currentPower = this.race.maxPower;
        this.currentHps = this.race.maxHps;
        this.pos = world.entrances[robotID];
    }
}
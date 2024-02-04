"use strict";
class Status {
    world;
    pos;
    targ;
    scan;
    name;
    race;
    currentPower;
    currentHps;
    constructor(world, robotID, name) {
        this.world = world;
        this.name = name;
        this.pos = new Vector(1, 1);
        this.targ = new Vector(0, 0);
        this.scan = new Scan(world.size);
        this.race = world.races[0];
        this.currentPower = this.race.maxPower;
        this.currentHps = this.race.maxHps;
        this.pos = world.entrances[robotID];
    }
}

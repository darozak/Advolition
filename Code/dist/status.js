"use strict";
class Status {
    name;
    world;
    pos;
    scan;
    race;
    currentPower;
    currentHps;
    // Equipped eqipment
    core;
    scanner;
    constructor(world, robotID, name) {
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

"use strict";
class Status {
    name;
    world;
    pos;
    scan;
    model;
    currentPower;
    currentHps;
    // Equipped eqipment
    core;
    scanner;
    constructor(world, robotID, name) {
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

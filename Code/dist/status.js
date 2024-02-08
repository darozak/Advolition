"use strict";
class Status {
    name;
    world;
    pos;
    scan;
    model;
    // currentPower: number;
    currentHps;
    // Equipped eqipment
    core;
    scanner;
    battery;
    constructor(world, robotID, name) {
        this.world = world;
        this.name = name;
        this.scan = new Scan(world.size);
        this.model = this.world.model[0];
        // this.currentPower = this.model.maxPower;
        this.currentHps = this.model.maxHps;
        this.pos = world.entrances[robotID];
        // Equip model's equipment
        this.scanner = this.model.scanner;
        this.core = this.model.core;
        this.battery = this.model.battery.clone();
    }
}

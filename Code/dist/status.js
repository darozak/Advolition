"use strict";
class Status {
    name;
    world;
    pos;
    scan;
    model;
    // Equipped eqipment
    core;
    scanner;
    battery;
    chassis;
    constructor(world, robotID, name) {
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

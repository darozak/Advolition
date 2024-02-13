"use strict";
class RobotData {
    scanTime = 0;
    robotID;
    name;
    pos;
    // Equipped eqipment 
    core;
    scanner;
    battery;
    chassis;
    constructor(world, robotID, name) {
        // this.world = world;
        this.robotID = robotID;
        this.name = name;
        let model = world.model[0];
        this.pos = world.entrances[robotID];
        // Add model's equipment
        this.scanner = model.scanner;
        this.core = model.core;
        this.battery = structuredClone(model.battery);
        this.chassis = structuredClone(model.chassis);
    }
}

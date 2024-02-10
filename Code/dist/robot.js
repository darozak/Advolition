"use strict";
class RobotData {
    clonedTime = 0;
    robotID;
    name;
    world;
    pos;
    model;
    // Equipped eqipment 
    core;
    scanner;
    battery;
    chassis;
    constructor(world, robotID, name) {
        this.world = world;
        this.robotID = robotID;
        this.name = name;
        this.model = this.world.model[0];
        this.pos = world.entrances[robotID];
        // Add model's equipment
        this.scanner = this.model.scanner;
        this.core = this.model.core;
        this.battery = this.model.battery.clone();
        this.chassis = this.model.chassis.clone();
    }
    clone(clonedTime) {
        var clone = new RobotData(this.world, this.robotID, this.name);
        clone.clonedTime = clonedTime;
        clone.pos = this.pos;
        clone.chassis = this.chassis;
        clone.battery = this.battery;
        clone.core = this.core;
        return clone;
    }
}

"use strict";
class RobotData {
    baseStats = new Stats();
    adjustedStats = new Stats();
    slots = [];
    items = [];
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
        let model = world.models[0];
        this.pos = world.entrances[robotID];
        this.baseStats.copy(world.robots[0].baseStats, true);
        this.adjustedStats.copy(world.robots[0].adjustedStats, true);
        this.slots = world.robots[0].slots;
        this.items = world.robots[0].items;
        // Add model's equipment
        this.scanner = model.scanner;
        this.core = model.core;
        this.battery = structuredClone(model.battery);
        this.chassis = structuredClone(model.chassis);
    }
}

"use strict";
class RobotData {
    baseStats = new Stats();
    adjustedStats = new Stats();
    items = [];
    lastScan = 0;
    robotID;
    name;
    pos;
    sprite = new Vector(23, 35);
    constructor(world, robotID, name) {
        this.robotID = robotID;
        this.name = name;
        this.pos = world.entrances[robotID];
        this.baseStats.copy(world.robots[0].baseStats);
        this.adjustedStats.copy(world.robots[0].adjustedStats);
        this.items = structuredClone(world.robots[0].items);
    }
}

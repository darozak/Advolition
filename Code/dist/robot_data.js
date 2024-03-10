"use strict";
class RobotData {
    baseStats = new Stats();
    adjustedStats = new Stats();
    items = [];
    lastScan = 0;
    robotID;
    name;
    isDisplayed;
    pos;
    sprite = new Vector(23, 35);
    logTime = [];
    logEntry = [];
    maxLogLength = 10;
    constructor(world, robotID, name, isDisplayed) {
        this.robotID = robotID;
        this.name = name;
        this.isDisplayed = isDisplayed;
        this.pos = world.entrances[robotID];
        this.baseStats.copy(world.robots[0].baseStats);
        this.adjustedStats.copy(world.robots[0].adjustedStats);
        this.items = structuredClone(world.robots[0].items);
    }
}

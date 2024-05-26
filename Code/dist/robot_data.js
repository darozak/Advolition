"use strict";
class RobotData {
    baseStats = new Attributes();
    adjustedStats = new Attributes();
    items = [];
    lastScan = 0;
    robotID;
    isAlive = true;
    name;
    isDisplayed;
    pos = new Vector(0, 0);
    sprite = new Vector(23, 35);
    logTime = [];
    logEntry = [];
    maxLogLength = 10;
    constructor(world, robotID, name, isDisplayed) {
        this.robotID = robotID;
        this.name = name;
        this.isDisplayed = isDisplayed;
        this.baseStats.copy(world.robots[0].baseStats);
        this.adjustedStats.copy(world.robots[0].adjustedStats);
        this.items = structuredClone(world.robots[0].items);
    }
}

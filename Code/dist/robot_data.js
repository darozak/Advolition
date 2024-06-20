"use strict";
class RobotData {
    baseStats = new Stats();
    stats = new Stats();
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
        this.stats.copy(world.robots[0].stats);
        this.items = structuredClone(world.robots[0].items);
    }
}

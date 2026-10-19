"use strict";
class RobotData {
    baseStats = new Stats();
    stats = new Stats();
    items = [];
    lastScan = 0;
    robotID;
    isAlive = true;
    deathTime = -1; // gameTime when the robot was destroyed
    // The last time this robot was hit: who fired, from where, and the
    // damage per element after shields. Null until it is first hit.
    lastHit = null;
    name;
    isDisplayed;
    pos = new Vector(0, 0);
    nest = new Vector(0, 0);
    sprite = new Vector(23, 35);
    logTime = [];
    logEntry = [];
    logRepeat = []; // how many times in a row each entry happened
    // The result of the robot's last action: its command, whether it worked
    // ('done' or 'failed'), why it failed, and when.
    lastAction = null;
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

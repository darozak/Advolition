
class RobotData {

    baseStats = new Stats();
    stats = new Stats();

    items: Item[] = [];

    lastScan: number = 0;
    robotID: number;
    isAlive: boolean = true;
    deathTime = -1;         // gameTime when the robot was destroyed
    // After respawning, the robot can't be damaged while gameTime is above
    // this (gameTime counts down). Infinity means it isn't protected.
    protectedUntil = Infinity;

    // The last time this robot was hit: who fired, from where, and the
    // damage per element after shields. Null until it is first hit.
    lastHit: { attackerID: number, attackerName: string, from: Vector, time: number, damage: number[] } | null = null;
    name: string;
    isDisplayed: boolean;
    pos = new Vector(0, 0);
    nest = new Vector(0, 0);
    sprite = new Vector(23, 35);

    logTime: number[] = [];
    logEntry: string[] = [];
    logRepeat: number[] = [];   // how many times in a row each entry happened

    // The result of the robot's last action: its command, whether it worked
    // ('done' or 'failed'), why it failed, and when.
    lastAction: { command: string, status: string, reason: string, time: number } | null = null;
    maxLogLength = 10;

    constructor(world: WorldData, robotID: number, name: string, isDisplayed: boolean) {
        this.robotID = robotID;
        this.name = name;
        this.isDisplayed = isDisplayed;

        this.baseStats.copy(world.robots[0].baseStats);
        this.stats.copy(world.robots[0].stats);

        this.items = structuredClone(world.robots[0].items);
    }
}

class RobotData {

    baseStats = new Stats();
    stats = new Stats();

    items: Item[] = [];

    lastScan: number = 0;
    robotID: number;
    isAlive: boolean = true;
    name: string;
    isDisplayed: boolean;
    pos = new Vector(0, 0);
    nest = new Vector(0, 0);
    sprite = new Vector(23, 35);

    logTime: number[] = [];
    logEntry: string[] = [];
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
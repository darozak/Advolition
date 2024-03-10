
class RobotData {

    baseStats = new Stats();
    adjustedStats = new Stats();

    items: Item[] = [];

    lastScan: number = 0;
    robotID: number;
    name: string;
    isDisplayed: boolean;
    pos: Vector;
    sprite = new Vector(23,35);

    logTime: number[] = [];
    logEntry: string[] = [];
    maxLogLength = 10;

    constructor(world: WorldData, robotID: number, name: string, isDisplayed: boolean) {
        this.robotID = robotID;
        this.name = name;
        this.isDisplayed = isDisplayed;
        this.pos = world.entrances[robotID];

        this.baseStats.copy(world.robots[0].baseStats);
        this.adjustedStats.copy(world.robots[0].adjustedStats);

        this.items = structuredClone(world.robots[0].items);
    }
}
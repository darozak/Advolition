class ScanData {
    mapSize: Vector;
    myID: number;
    gameTime = 0;
    scanTime: number[][] = [];
    tileMap: number[][] = [];
    tiles: Tile[] = [];
    itemMap: Item[][][] = [];
    robotMap: number[][] = [];
    robots: RobotData[] = [];
    robotCount = 0;

    constructor(world: WorldData, robot: RobotData) {

        this.mapSize = new Vector(world.size.x, world.size.y);

        this.myID = robot.robotID;

        // Only this robot's own entry is known at the start. Others are
        // filled in when they are first scanned.
        this.robots[robot.robotID] = structuredClone(robot);

        for(var i = 0; i < world.tiles.length; i++) {
            this.tiles.push(structuredClone(world.tiles[i]));
        }

        for(var i = 0; i < world.size.x; i++) {
            // this.visible[i] = [];
            this.tileMap[i] = [];
            this.itemMap[i] = [];
            this.robotMap[i] = [];
            this.scanTime[i] = []

            for(var j = 0; j < world.size.y; j++) {
                // this.visible[i][j] = -1;
                this.tileMap[i][j] = -1;
                this.itemMap[i][j] = [];
                this.robotMap[i][j] = -1;
                this.scanTime[i][j] = -1;
            }
        }
    }
}
class ScanData {

    // visible: number[][] = [];
    scanTime: number[][] = [];
    tileMap: number[][] = [];
    robotMap: number[][] = [];
    robots: RobotData[] = [];

    constructor(world: World, robot: RobotData) {

        for(var i = 0; i < world.maxRobotCount; i++) {
            this.robots.push(robot.clone(0));
        }

        for(var i = 0; i < world.size.x; i++) {
            // this.visible[i] = [];
            this.tileMap[i] = [];
            this.robotMap[i] = [];
            this.scanTime[i] = []

            for(var j = 0; j < world.size.y; j++) {
                // this.visible[i][j] = -1;
                this.tileMap[i][j] = -1;
                this.robotMap[i][j] = -1;
                this.scanTime[i][j] = 0;
            }
        }
    }
}
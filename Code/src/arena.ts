/**
 * This class manages a layered map grid with information on scan times, tiles,
 * and NPCs for each x, y position.
 */
class Arena {
    world: WorldData;
    mask: boolean[][] = [];
    scans: number[][] = [];
    tileMap: number[][] = [];
    itemMap: Item[][][] = [];
    robotMap: number[][] = [];
    robots: RobotData[] = [];

    fov = new PreciseShadowcasting();

    constructor(world: WorldData, robots: RobotData[]) {
        this.world = world;
        this.robots = robots;

        for(var i = 0; i < this.world.size.x; i ++) {
            this.mask[i] = [];
            this.scans[i] = [];
            this.tileMap[i] = [];
            this.itemMap[i] = [];
            this.robotMap[i] = [];
            for(var j = 0; j < this.world.size.y; j ++) {
                this.mask[i][j] = false;
                this.scans[i][j] = -1;
                this.tileMap[i][j] = -1;
                this.itemMap[i][j] = [];
                this.robotMap[i][j] = -1;
            }
        }
    }

    generate() {
        // Make sure world size matches sketch.
        this.world.size.x = this.world.sketch.length;
        this.world.size.y = this.world.sketch[0].length;

        // Use sketch to populate mask and tile arrays.
        for(var i = 0; i < this.world.size.x; i++) {
            this.mask[i] = [];
            this.tileMap[i] = [];
            for(var j = 0; j < this.world.size.y; j++) {
                let tileID = this.world.tiles.findLastIndex(d => d.key === this.world.sketch[i][j]);
                this.mask[i][j] = this.world.tiles[tileID].transparent;
                this.tileMap[i][j] =tileID;
            }
        }
    }
  
    scan(pov: Vector, scanRadius: number, scan: ScanData, scanTime: number) {
        var visible: number[][] = this.fov.compute(pov.x, pov.y, scanRadius, this.mask);

        for(var i = 0; i < this.world.size.x; i++) {

            for(var j = 0; j < this.world.size.y; j++) {
                if(visible[i][j] > 0) {
                    scan.scanTime[i][j] = scanTime;
                    scan.tileMap[i][j] = this.tileMap[i][j];
                    scan.itemMap[i][j] = this.itemMap[i][j];
                    scan.robotMap[i][j] = this.robotMap[i][j];
                    if(this.robotMap[i][j] >= 0) {
                        scan.robots[this.robotMap[i][j]] = structuredClone(this.robots[this.robotMap[i][j]]);
                        scan.robots[this.robotMap[i][j]].lastScan = scanTime;
                    }
                }
            }
        }

        // Erase self from robot scan.
        scan.robotMap[pov.x][pov.y] = -1;

        return scan;
    }

    getTileSpeed(pos: Vector) {
        return this.world.tiles[this.tileMap[pos.x][pos.y]].speed;
    }

    toggleDoor(target: Vector) {
        let tileID = this.tileMap[target.x][target.y];
        switch(this.world.tiles[tileID].name) {
            case "Closed Door":
                let openDoorID = this.world.tiles.findLastIndex(d => d.name === "Open Door");
                this.tileMap[target.x][target.y] = openDoorID;
                this.mask[target.x][target.y] = true;
                break;
            case "Open Door":
                let closedDoorID = this.world.tiles.findLastIndex(d => d.name === "Closed Door");
                this.tileMap[target.x][target.y] = closedDoorID;
                this.mask[target.x][target.y] = false;
                break;
        }
    }
}
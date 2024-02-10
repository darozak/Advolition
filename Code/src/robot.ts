
class RobotData {

    clonedTime: number = 0;
    robotID: number;
    name: string;
    world: World;
    pos: Vector;
    model: Model;

    // Equipped eqipment 
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;

    constructor(world: World, robotID: number, name: string) {
        this.world = world;
        this.robotID = robotID;
        this.name = name;
        this.model = this.world.model[0];
        this.pos = world.entrances[robotID];

        // Add model's equipment
        this.scanner = this.model.scanner;      
        this.core = this.model.core;
        this.battery = this.model.battery.clone();
        this.chassis = this.model.chassis.clone();
    }

    clone(clonedTime: number) {
        var clone = new RobotData(this.world, this.robotID, this.name);
        clone.clonedTime = clonedTime;
        clone.pos = this.pos;
        clone.chassis = this.chassis;
        clone.battery = this.battery; 
        clone.core = this.core;

        return clone;
    }

}
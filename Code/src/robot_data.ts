
class RobotData {

    attributes: Attributes;
    slots: Slot[] = [];
    items: Item[] = [];

    scanTime: number = 0;
    robotID: number;
    name: string;
    pos: Vector;

    // Equipped eqipment 
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;

    constructor(world: WorldData, robotID: number, name: string) {
        // this.world = world;
        this.robotID = robotID;
        this.name = name;
        let model = world.models[0];
        this.pos = world.entrances[robotID];

        this.attributes = world.robots[0].attributes;
        this.slots = world.robots[0].slots;
        this.items = world.robots[0].items;

        // Add model's equipment
        this.scanner = model.scanner;      
        this.core = model.core;
        this.battery = structuredClone(model.battery);
        this.chassis = structuredClone(model.chassis);
    }
}
interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface Model   {
    name: string;
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;
}

interface World {
    maxRobotCount: number;
    size: Vector;
    sketch: string[];
    entrances: Vector[];
    tiles: Feature[];
    model: Model[];
}
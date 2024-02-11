interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    transparent: boolean;
    speed: number;
}

interface Model   {
    name: string;
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;
}

interface WorldData {
    maxRobotCount: number;
    size: Vector;
    sketch: string[];
    entrances: Vector[];
    tiles: Feature[];
    model: Model[];
}
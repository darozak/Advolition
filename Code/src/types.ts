interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface Model   {
    name: string;
    // sprite: Vector;
    // maxHps: number;
    core: Core;
    scanner: Scanner;
    battery: Battery;
    chassis: Chassis;
}

interface World {
    size: Vector;
    sketch: string[];
    entrances: Vector[];
    tiles: Feature[];
    model: Model[];
}
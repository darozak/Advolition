interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface Model   {
    name: string;
    sprite: Vector;
    maxPower: number;
    maxHps: number;
    core: Core;
    scanner: Scanner;
}

interface World {
    size: Vector;
    sketch: string[];
    entrances: Vector[];
    tiles: Feature[];
    model: Model[];
}
interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface Race   {
    name: string;
    sprite: Vector;
    maxPower: number;
    maxHps: number;
    move: number;
}

interface World {
    size: Vector;
    // players: Player[];
    sketch: string[];
    entrances: Vector[];
    tiles: Feature[];
    races: Race[];
}
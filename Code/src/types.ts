interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface NPC {
    name: string;
}

interface World {
    size: Vector;
    entrance: Vector;
    sketch: string[];
    tiles: Feature[];
    npcs: NPC[];
}




interface Feature {
    name: string;
    key: string;
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




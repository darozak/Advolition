interface Feature {
    name: string;
    key: string;
    sprite: Vector;
    speed: number;
}

interface Player {
    sprite: Vector;
    entrance: Vector;
}

interface NPC {
    name: string;
}

interface World {
    size: Vector;
    players: Player[];
    sketch: string[];
    tiles: Feature[];
    npcs: NPC[];
}




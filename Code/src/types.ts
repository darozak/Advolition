interface Feature {
    name: string;
    key: string;
    speed: number;
}

interface NPC {
    name: string;
}

interface World {
    tiles: Feature[];
    npcs: NPC[];
}




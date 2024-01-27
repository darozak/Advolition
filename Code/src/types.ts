interface Tile {
    name: string;
    key: string;
    speed: number;
}

interface NPC {
    name: string;
}

interface World {
    tiles: Tile[];
    npcs: NPC[];
}
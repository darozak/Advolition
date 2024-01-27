const data: Data = {
    tiles: [
        {
            name: "Floor",
            key: ".",
            speed: 1.0
        },
        {
            name: "Wall",
            key: "#",
            speed: 0.0
        },
        {
            name: "Open Door",
            key: "/",
            speed: 1.0
        },
        {
            name: "Closed Door",
            key: "+",
            speed: 0.0
        }
    ],
    npcs: [
        {
            name: "Orc",
        },
        {
            name: "Dragon",
        }
    ]
};

interface Tile {
    name: string;
    key: string;
    speed: number;
}

interface NPC {
    name: string;
}

interface Data {
    tiles: Tile[];
    npcs: NPC[];
}
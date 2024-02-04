"use strict";
const gaia = {
    size: new Vector(10, 10),
    players: [
        {
            // sprite: new Vector(17,18),
            sprite: new Vector(23, 32),
            entrance: new Vector(1, 1)
        },
        {
            sprite: new Vector(30, 32),
            entrance: new Vector(8, 8)
        },
        {
            sprite: new Vector(23, 35),
            entrance: new Vector(8, 1)
        },
        {
            sprite: new Vector(30, 35),
            entrance: new Vector(1, 8)
        }
    ],
    sketch: [
        "##########",
        "#........#",
        "#........#",
        "#.......##",
        "##..######",
        "#........#",
        "#........#",
        "#........#",
        "#........#",
        "##########"
    ],
    tiles: [
        {
            name: "Floor",
            key: ".",
            sprite: new Vector(16, 31),
            speed: 1.0
        },
        {
            name: "Wall",
            key: "#",
            sprite: new Vector(10, 10),
            speed: 0.0
        },
        {
            name: "Open Door",
            key: "/",
            sprite: new Vector(13, 3),
            speed: 1.0
        },
        {
            name: "Closed Door",
            key: "+",
            sprite: new Vector(12, 3),
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

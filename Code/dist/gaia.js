"use strict";
const gaia = {
    size: new Vector(10, 10),
    entrance: new Vector(1, 1),
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

"use strict";
const gaia = {
    size: new Vector(5, 5),
    entrance: new Vector(1, 1),
    sketch: [
        "#####",
        "#...#",
        "#.###",
        "#...#",
        "#####"
    ],
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

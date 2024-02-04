const gaia: World = {
    size: new Vector(10,10),
    
    entrances: [
        new Vector(1,1),
        new Vector(8,8),
        new Vector(8,1),
        new Vector(1,8)
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
            sprite: new Vector(16,31),
            speed: 1.0
        },
        {
            name: "Wall",
            key: "#",
            sprite: new Vector(10,10),
            speed: 0.0
        },
        {
            name: "Open Door",
            key: "/",
            sprite: new Vector(13,3),
            speed: 1.0
        },
        {
            name: "Closed Door",
            key: "+",
            sprite: new Vector(12,3),
            speed: 0.0
        }
    ],
    races: [
        {
            name: "Humanoid",
            sprite: new Vector(23,35),
            maxPower: 100,
            maxHps: 100,
            move: 10         
        },
        {
            name: "Orc",
            sprite: new Vector(0, 0),
            maxPower: 80,
            maxHps: 80,
            move: 8
        }
    ]
};


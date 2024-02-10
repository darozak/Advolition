const gaia: WorldData = {
    maxRobotCount: 10,
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
    model: [
        {
            name: "Humanoid",
            core: new Core(
                'Power Core',   // Name
                10,             // Mass
                [0, 1, 2],      // Power
                [3, 2, 1]       // Speed
                ),
            scanner: new Scanner(
                'Scantron 8000',// Name
                10,             // Mass
                [1, 2, 3],      // Power 
                [1, 1, 2],      // Speed 
                [3, 5, 7]       // Range
                ),
            battery: new Battery('Power Cell', 10, 110),
            chassis: new Chassis('Humanoid', new Vector(23,35), 100, 100)
        },
        {
            name: "Orc",
            core: new Core(
                'Power Core',   // Name
                10,             // Mass
                [0, 1, 2],      // Power
                [3, 2, 1]       // Speed
                ),
            scanner: new Scanner(
                'Scantron 8000',// Name
                10,             // Mass
                [1, 2, 3],      // Power 
                [1, 1, 2],      // Speed 
                [3, 5, 7]       // Range
                ),
            battery: new Battery('Power Cell', 10, 110),
            chassis: new Chassis('Humanoid', new Vector(23,35), 100, 100)
        }
    ]
};


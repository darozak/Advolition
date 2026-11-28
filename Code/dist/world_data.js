"use strict";
class GaiaData extends WorldData {
    constructor() {
        super();
        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16, 31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10, 10), false, 0.0));
        this.tiles.push(new Tile("Door", "+", new Vector(13, 3), false, 0.0));
        this.tiles.push(new Tile("Nest", "@", new Vector(14, 1), true, 1.0));
        // Create Items (each item class is defined in items.ts)
        this.items.push(new Scanner());
        this.items.push(new Blaster());
        this.items.push(new Railgun());
        this.items.push(new IonGun());
        this.items.push(new ThermalShield());
        this.items.push(new KineticShield());
        this.items.push(new EMShield());
        this.items.push(new Armor());
        // Treasure, from least to most valuable: [name, worth, bulk].
        const treasures = [
            ['Ancient Coin', 12, 0],
            ['Pearl Necklace', 18, 1],
            ['Ruby', 25, 1],
            ['Meteorite Shard', 35, 3],
            ['Crystal Skull', 45, 2],
            ['Jeweled Crown', 55, 2],
            ['Golden Statue', 60, 5],
            ['Ancient AI Core', 70, 1],
            ['Dragon Egg', 90, 6],
        ];
        treasures.forEach(([name, worth, bulk]) => this.treasures.push(new Treasure(name, worth, bulk)));
        console.log(this.items);
        // Create New Robot Models
        this.robots[0] = new Robot(this.items);
        console.log(this.robots[0]);
    }
}

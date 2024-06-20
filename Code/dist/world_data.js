"use strict";
class GaiaData extends WorldData {
    constructor() {
        super();
        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16, 31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10, 10), false, 0.0));
        this.tiles.push(new Tile("Door", "+", new Vector(12, 3), false, 0.0));
        // Create Items
        var stats;
        stats = new Stats();
        stats.scanCost = 0;
        stats.scanRange = 4;
        stats.scanTime = 8;
        this.items.push(new Item('Scanner', stats));
        stats = new Stats();
        stats.attack[1] = 4;
        this.items.push(new Item('Blaster', stats));
        stats = new Stats();
        stats.shield[1] = 1;
        this.items.push(new Item('Shield', stats));
        stats = new Stats();
        stats.armor[0] = 60;
        stats.armor[1] = 60;
        stats.armor[2] = 60;
        this.items.push(new Item('Armor', stats));
        stats = new Stats();
        stats.power = 2000;
        stats.maxPower = 2000;
        this.items.push(new Item('Battery', stats));
        console.log(this.items);
        // Create New Robot Models
        this.robots[0] = new Humanoid(this.items);
        console.log(this.robots[0]);
    }
}

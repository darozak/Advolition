"use strict";
class GaiaData extends WorldData {
    constructor() {
        super();
        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16, 31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10, 10), false, 0.0));
        this.tiles.push(new Tile("Door", "+", new Vector(12, 3), false, 0.0));
        // Create Items
        var effects;
        effects = new Stats();
        effects.scanPower = 0;
        effects.scanRange = 4;
        effects.scanTime = 8;
        this.items.push(new Item('Scanner', effects));
        effects = new Stats();
        effects.thermalDamage = 4;
        this.items.push(new Item('Blaster', effects));
        effects = new Stats();
        effects.thermalDefense = 1;
        this.items.push(new Item('Shield', effects));
        effects = new Stats();
        effects.HPs = 60;
        effects.maxHPs = 60;
        this.items.push(new Item('Armor', effects));
        effects = new Stats();
        effects.power = 2000;
        effects.maxPower = 2000;
        this.items.push(new Item('Battery', effects));
        console.log(this.items);
        // Create New Robot Models
        this.robots[0] = new Humanoid(this.items);
        console.log(this.robots[0]);
    }
}

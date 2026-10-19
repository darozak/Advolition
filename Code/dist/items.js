"use strict";
/**
 * Each in-game item is its own subclass of Item, so its stats are defined
 * in one place. To add an item, create a new subclass here and add it to a
 * world's item list (see GaiaData in world_data.ts).
 *
 * Note: the game copies items with structuredClone, which keeps their data
 * but not their class. Copies on the map or in a robot's inventory are plain
 * objects, so identify them by `name`, not with `instanceof`.
 */
class Scanner extends Item {
    constructor() {
        super('Scanner', new Stats());
        this.stats.worth = 10;
        this.stats.bulk = 3;
        this.stats.scanRange = 4;
        this.stats.scanTime = 8;
    }
}
class Blaster extends Item {
    constructor() {
        super('Blaster', new Stats());
        this.stats.worth = 20;
        this.stats.bulk = 2;
        this.stats.attack[1] = 4; // Thermal
    }
}
class Shield extends Item {
    constructor() {
        super('Shield', new Stats());
        this.stats.worth = 5;
        this.stats.bulk = 4;
        this.stats.shield[1] = 1; // Thermal
    }
}
class Armor extends Item {
    constructor() {
        super('Armor', new Stats());
        this.stats.worth = 6;
        this.stats.bulk = 1;
        this.stats.armor[0] = 60; // Kinetic
        this.stats.armor[1] = 60; // Thermal
        this.stats.armor[2] = 60; // ElectroMagnetic
    }
}

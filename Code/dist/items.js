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
// Weapons: one per element. Heavier weapons hit harder.
class Railgun extends Item {
    constructor() {
        super('Railgun', new Stats());
        this.stats.worth = 25;
        this.stats.bulk = 4;
        this.stats.attack[0] = 6; // Kinetic
    }
}
class IonGun extends Item {
    constructor() {
        super('Ion Gun', new Stats());
        this.stats.worth = 15;
        this.stats.bulk = 1;
        this.stats.attack[2] = 3; // ElectroMagnetic
    }
}
// Shields: one per element. A shield blocks part of every hit of its
// element, but never more than half of it (see Game.resolveAttack).
class ThermalShield extends Item {
    constructor() {
        super('Thermal Shield', new Stats());
        this.stats.worth = 8;
        this.stats.bulk = 2;
        this.stats.shield[1] = 2; // Thermal
    }
}
class KineticShield extends Item {
    constructor() {
        super('Kinetic Shield', new Stats());
        this.stats.worth = 8;
        this.stats.bulk = 2;
        this.stats.shield[0] = 3; // Kinetic
    }
}
class EMShield extends Item {
    constructor() {
        super('EM Shield', new Stats());
        this.stats.worth = 8;
        this.stats.bulk = 2;
        this.stats.shield[2] = 2; // ElectroMagnetic
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

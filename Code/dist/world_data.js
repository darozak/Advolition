"use strict";
class Tile {
    name;
    key;
    sprite;
    transparent;
    speed;
    constructor(name, key, sprite, transparent, speed) {
        this.name = name;
        this.key = key;
        this.sprite = sprite;
        this.transparent = transparent;
        this.speed = speed;
    }
}
class Model {
    name;
    core;
    scanner;
    battery;
    chassis;
    constructor(name, core, scanner, battery, chassis) {
        this.name = name;
        this.core = core;
        this.scanner = scanner;
        this.battery = battery;
        this.chassis = chassis;
    }
}
class WorldData {
    maxRobotCount = 10;
    size = new Vector(10, 10);
    sketch = [];
    entrances = [];
    tiles = [];
    slots = [];
    items = [];
    models = [];
    robots = [];
    constructor() {
    }
}
class GaiaData extends WorldData {
    constructor() {
        super();
        // Sketch Map
        this.sketch = [
            "##########",
            "#.*......#",
            "#........#",
            "#...&...##",
            "###+######",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            "##########"
        ];
        // Define Entrances
        this.entrances.push(new Vector(1, 1));
        this.entrances.push(new Vector(8, 8));
        this.entrances.push(new Vector(8, 1));
        this.entrances.push(new Vector(1, 8));
        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16, 31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10, 10), false, 0.0));
        this.tiles.push(new Tile("Open Door", "/", new Vector(13, 3), true, 1.0));
        this.tiles.push(new Tile("Closed Door", "+", new Vector(12, 3), false, 0.0));
        this.tiles.push(new Tile("Power Station", "*", new Vector(18, 21), true, 0.0));
        this.tiles.push(new Tile("Repair Bay", "&", new Vector(17, 20), true, 0.0));
        // Define Slots
        this.slots.push(new Slot("Battery Slot", 10));
        this.slots.push(new Slot("Weapon Slot", 10));
        // Create Robot Models
        this.models.push(new Model("Humanoid", new Core('Power Core', // Name
        10, // Mass
        [0, 1, 2], // Power
        [10, 6, 4] // Speed
        ), new Scanner('Scantron 8000', // Name
        10, // Mass
        [1, 2, 3], // Power 
        [4, 8, 12], // Speed 
        [3, 5, 7] // Range
        ), new Battery('Power Cell', 10, 110), new Chassis('Humanoid', new Vector(23, 35), 100, 100)));
        // Create Items
        var effects;
        effects = new Stats();
        effects.kineticDamage = 1;
        this.items.push(new Item('Vorpal Sword', 'Weapon Slot', effects));
        effects = new Stats();
        effects.thermalDamage = 2;
        this.items.push(new Item('Blaster', 'Weapon Slot', effects));
        effects = new Stats();
        effects.thermalDefense = 2;
        this.items.push(new Item('Shield', 'Shield Slot', effects));
        effects = new Stats();
        effects.power = 10;
        effects.maxPower = 10;
        this.items.push(new Item('Battery', 'Battery Slot', effects));
        console.log(this.items);
        // Create New Robot Models
        this.robots[0] = new Humanoid(this.slots, this.items);
        console.log(this.robots[0]);
    }
}
/**
 * Items applly all modifiers when equipped.
 * Howerver they only incur a power cost when triggered by a particular action.
 * Every time items are re-equipped, all attributes (except HPs and power) will be
 * reset to the base value, and the mods will be reapplied for equipped items.
 * This approach will allow the robot to assess it's appilities with respect to
 * potential actions.  However, the power costs will only be applied if the trigger
 * action takes place.
 */
class Attribute {
    current = 0;
    base = 0;
    constructor() { }
    set(current) {
        this.current = current;
    }
}
class Stats {
    // Non-transient stats
    HPs = 0;
    power = 0;
    // Transient stats
    maxHPs = 0;
    maxPower = 0;
    scanPower = 0;
    scanTime = 0;
    scanRange = 0;
    offensePower = 0;
    offenseTime = 0;
    kineticDamage = 0;
    thermalDamage = 0;
    defensePower = 0;
    kineticDefense = 0;
    thermalDefense = 0;
    movePower = 0;
    moveTime = 0;
    backgroundPower = 0;
    constructor() { }
    add(stats) {
        this.HPs += stats.HPs;
        this.maxHPs += stats.maxHPs;
        this.power += stats.power;
        this.maxPower += stats.maxPower;
        this.scanPower += stats.scanPower;
        this.scanTime += stats.scanTime;
        this.scanRange += stats.scanRange;
        this.offensePower += stats.offensePower;
        this.offenseTime += stats.offenseTime;
        this.kineticDamage += stats.kineticDamage;
        this.thermalDamage += stats.thermalDamage;
        this.defensePower += stats.defensePower;
        this.kineticDefense += stats.kineticDefense;
        this.thermalDefense += stats.thermalDefense;
        this.movePower += stats.movePower;
        this.moveTime += stats.moveTime;
        this.backgroundPower += stats.backgroundPower;
    }
    copy(stats, copyAll) {
        if (copyAll) {
            // Non-transient stats
            this.HPs = stats.HPs;
            this.power = stats.power;
        }
        // Transient stats
        this.maxHPs = stats.maxHPs;
        this.maxPower = stats.maxPower;
        this.scanPower = stats.scanPower;
        this.scanTime = stats.scanTime;
        this.scanRange = stats.scanRange;
        this.offensePower = stats.offensePower;
        this.offenseTime = stats.offenseTime;
        this.kineticDamage = stats.kineticDamage;
        this.thermalDamage = stats.thermalDamage;
        this.defensePower = stats.defensePower;
        this.kineticDefense = stats.kineticDefense;
        this.thermalDefense = stats.thermalDefense;
        this.movePower = stats.movePower;
        this.moveTime = stats.moveTime;
        this.backgroundPower = stats.backgroundPower;
    }
}
class Slot {
    name;
    count = 0;
    timeToEquip;
    constructor(name, timeToEquip) {
        this.name = name;
        this.timeToEquip = timeToEquip;
    }
}
class Robot {
    baseStats = new Stats();
    adjustedStats = new Stats();
    slots = [];
    items = [];
    constructor() { }
}
class Humanoid extends Robot {
    constructor(slots, items) {
        super();
        this.slots = slots;
        var ID;
        // Set base stats
        this.baseStats.HPs = 100;
        this.baseStats.maxHPs = 100;
        this.baseStats.power = 100;
        this.baseStats.maxPower = 100;
        this.baseStats.moveTime = 10;
        this.adjustedStats.copy(this.baseStats, true);
        // Add slots
        ID = this.slots.findLastIndex(d => d.name === "Battery Slot");
        if (ID >= 0)
            this.slots[ID].count++;
        ID = slots.findLastIndex(d => d.name === "Weapon Slot");
        if (ID >= 0)
            this.slots[ID].count++;
        ID = slots.findLastIndex(d => d.name === "Weapon Slot");
        if (ID >= 0)
            this.slots[ID].count++;
        // Add items
        ID = items.findLastIndex(d => d.name === "Battery");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Blaster");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Shield");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Vorpal Sword");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Vorpal Sword");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
    }
}
class Item {
    name;
    slot;
    effects;
    isEquipped = false;
    constructor(name, slot, effects) {
        this.name = name;
        this.slot = slot;
        this.effects = effects;
    }
}

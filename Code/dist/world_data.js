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
        effects = new Attributes();
        effects.damage.current = 1;
        this.items.push(new Item('Vorpal Sword', 'Weapon Slot', Trigger.attacking, 1, effects, 10));
        effects = new Attributes();
        effects.damage.current = 2;
        this.items.push(new Item('Blaster', 'Weapon Slot', Trigger.attacking, 1, effects, 10));
        effects = new Attributes();
        effects.damage.current = 2;
        this.items.push(new Item('Shield', 'Shield Slot', Trigger.attacking, 1, effects, 10));
        effects = new Attributes();
        effects.power.current = 10;
        effects.maxPower.current = 10;
        this.items.push(new Item('Battery', 'Battery Slot', Trigger.attacking, 0, effects, 10));
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
class Attributes {
    HPs = new Attribute();
    maxHPs = new Attribute();
    power = new Attribute();
    maxPower = new Attribute();
    damage = new Attribute();
    defense = new Attribute();
    moveTime = new Attribute();
    constructor() { }
}
var Trigger;
(function (Trigger) {
    Trigger[Trigger["attacking"] = 0] = "attacking";
    Trigger[Trigger["defending"] = 1] = "defending";
    Trigger[Trigger["moving"] = 2] = "moving";
})(Trigger || (Trigger = {}));
;
// enum Slot {shield, weapon};
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
    attributes = new Attributes();
    slots = [];
    items = [];
    constructor() { }
}
class Humanoid extends Robot {
    constructor(slots, items) {
        super();
        this.slots = slots;
        var ID;
        // Set attributes
        this.attributes.HPs.base = 100;
        this.attributes.maxHPs.base = 100;
        this.attributes.power.base = 100;
        this.attributes.maxPower.base = 100;
        this.attributes.moveTime.base = 10;
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
    mass;
    powerTrigger;
    powerCost;
    effects;
    isEquipped = false;
    constructor(name, slot, trigger, powerCost, effects, mass) {
        this.name = name;
        this.slot = slot;
        this.powerTrigger = trigger;
        this.powerCost = powerCost;
        this.effects = effects;
        this.mass = mass;
    }
}

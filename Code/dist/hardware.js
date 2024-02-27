"use strict";
class Slot {
    name;
    count = 0;
    timeToEquip;
    constructor(name, timeToEquip) {
        this.name = name;
        this.timeToEquip = timeToEquip;
    }
}
class Item {
    name;
    slot;
    effects;
    isActive = false;
    isEquipped = false;
    constructor(name, slot, effects) {
        this.name = name;
        this.slot = slot;
        this.effects = effects;
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
    permissiveTerrain = [];
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
        for (var i = 0; i < stats.permissiveTerrain.length; i++) {
            this.permissiveTerrain.push(stats.permissiveTerrain[i]);
        }
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
        this.permissiveTerrain = stats.permissiveTerrain;
        this.backgroundPower = stats.backgroundPower;
    }
}
class Robot {
    baseStats = new Stats();
    adjustedStats = new Stats();
    slots = [];
    items = [];
    constructor() {
        // Non-transient stats
        this.baseStats.HPs = 90;
        this.baseStats.power = 90;
        // Transient stats
        this.baseStats.maxHPs = 90;
        this.baseStats.maxPower = 90;
        this.baseStats.scanPower = 1;
        this.baseStats.scanTime = 10;
        this.baseStats.scanRange = 5;
        this.baseStats.offensePower = 0;
        this.baseStats.offenseTime = 0;
        this.baseStats.kineticDamage = 0;
        this.baseStats.thermalDamage = 0;
        this.baseStats.defensePower = 0;
        this.baseStats.kineticDefense = 0;
        this.baseStats.thermalDefense = 0;
        this.baseStats.movePower = 1;
        this.baseStats.moveTime = 10;
        this.baseStats.permissiveTerrain = [
            'Floor',
            'Closed Door'
        ];
        this.baseStats.backgroundPower = 0;
    }
}
class Humanoid extends Robot {
    constructor(slots, items) {
        super();
        this.slots = slots;
        var ID;
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
class WorldData {
    maxRobotCount = 10;
    size = new Vector(10, 10);
    itemSprite = new Vector(18, 27);
    sketch = [];
    entrances = [];
    tiles = [];
    slots = [];
    items = [];
    robots = [];
    constructor() {
    }
}

"use strict";
class Item {
    name;
    effects;
    isActive = false;
    isEquipped = false;
    constructor(name, effects) {
        this.name = name;
        this.effects = effects;
    }
}
class Stats {
    value = 0;
    HPs = 0;
    maxHPs = 0;
    power = 0;
    maxPower = 0;
    maxCarry = 0;
    maxEquip = 0;
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
        this.value += stats.value;
        this.HPs += stats.HPs;
        this.maxHPs += stats.maxHPs;
        this.maxCarry += stats.maxCarry;
        this.maxEquip += stats.maxEquip;
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
    copy(stats) {
        this.value = stats.value;
        this.maxHPs = stats.maxHPs;
        this.HPs = stats.HPs;
        this.maxPower = stats.maxPower;
        this.power = stats.power;
        this.maxCarry = stats.maxCarry;
        this.maxEquip = stats.maxEquip;
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
    items = [];
    constructor() {
        this.baseStats.maxCarry = 4;
        this.baseStats.maxEquip = 3;
        this.baseStats.HPs = 0;
        this.baseStats.maxHPs = 0;
        this.baseStats.power = 0;
        this.baseStats.maxPower = 0;
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
            'Door'
        ];
        this.baseStats.backgroundPower = 0;
    }
}
class Humanoid extends Robot {
    constructor(items) {
        super();
        var ID;
        this.adjustedStats.copy(this.baseStats);
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
    // slots: Slot[] = [];
    items = [];
    robots = [];
    constructor() {
    }
}

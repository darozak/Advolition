"use strict";
class Item {
    name;
    stats;
    timeToEquip = 10;
    isEquipped = false;
    constructor(name, effects) {
        this.name = name;
        this.stats = effects;
    }
}
class Stats {
    worth = 0;
    bulk = 0;
    elements = [];
    armor = [];
    maxCarry = 0;
    maxEquip = 0;
    scanTime = 0;
    scanRange = 0;
    attackTime = 0;
    attack = [];
    shield = [];
    moveTime = 0;
    permissiveTerrain = [];
    constructor() {
        this.elements.push('Kinetic');
        this.elements.push('Thermal');
        this.elements.push('ElectroMagnetic');
        for (var i = 0; i < this.elements.length; i++) {
            this.armor.push(0);
            this.shield.push(0);
            this.attack.push(0);
        }
    }
    add(stats) {
        this.worth += stats.worth;
        this.bulk += stats.bulk;
        for (var i = 0; i < this.elements.length; i++) {
            this.armor[i] += stats.armor[i];
            this.shield[i] += stats.shield[i];
            this.attack[i] += stats.attack[i];
        }
        this.maxCarry += stats.maxCarry;
        this.maxEquip += stats.maxEquip;
        this.scanTime += stats.scanTime;
        this.scanRange += stats.scanRange;
        this.attackTime += stats.attackTime;
        this.moveTime += stats.moveTime;
        for (var i = 0; i < stats.permissiveTerrain.length; i++) {
            this.permissiveTerrain.push(stats.permissiveTerrain[i]);
        }
    }
    copy(stats) {
        this.worth = stats.worth;
        this.bulk = stats.bulk;
        for (var i = 0; i < this.elements.length; i++) {
            this.armor[i] = stats.armor[i];
            this.shield[i] = stats.shield[i];
            this.attack[i] = stats.attack[i];
        }
        this.maxCarry = stats.maxCarry;
        this.maxEquip = stats.maxEquip;
        this.scanTime = stats.scanTime;
        this.scanRange = stats.scanRange;
        this.attackTime = stats.attackTime;
        this.moveTime = stats.moveTime;
        this.permissiveTerrain = stats.permissiveTerrain;
    }
    getActionTime() {
        const BASE_DELAY = 10;
        return this.bulk + BASE_DELAY;
    }
}
class Robot {
    baseStats = new Stats();
    stats = new Stats();
    items = [];
    constructor(items) {
        this.baseStats.maxCarry = 8;
        this.baseStats.maxEquip = 4;
        this.baseStats.moveTime = 10;
        this.baseStats.permissiveTerrain = [
            'Floor',
            'Door'
        ];
        var ID;
        this.stats.copy(this.baseStats);
        // Add items
        ID = items.findLastIndex(d => d.name === "Blaster");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Scanner");
        if (ID >= 0)
            this.items.push(structuredClone(items[ID]));
        ID = items.findLastIndex(d => d.name === "Armor");
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

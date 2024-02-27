class Slot {
    name: string;
    count: number = 0;
    timeToEquip: number;

    constructor(name: string, timeToEquip: number) {
        this.name = name;
        this.timeToEquip = timeToEquip;
    }
}
 
class Item {   
    name: string;
    slot: string;
    effects: Stats;
    isActive: boolean = false;
    isEquipped: boolean = false;

    constructor(name: string, slot: string, effects: Stats) {
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
    permissiveTerrain: string[] = [];

    triggerPower = 0;
    triggerTime = 0;
    triggerRange = 0;

    backgroundPower = 0;

    constructor() {}

    add(stats: Stats) {
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
        for(var i = 0; i < stats.permissiveTerrain.length; i ++) {
            this.permissiveTerrain.push(stats.permissiveTerrain[i]);
        }

        this.triggerPower += stats.triggerPower;
        this.triggerTime += stats.triggerTime;
        this.triggerRange += stats.triggerRange;

        this.backgroundPower += stats.backgroundPower;
    }

    copy(stats: Stats, copyAll: boolean) {

        if(copyAll) {
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

        this.triggerPower = stats.triggerPower;
        this.triggerTime = stats.triggerTime;
        this.triggerRange = stats.triggerRange;

        this.backgroundPower = stats.backgroundPower;
    } 
}

class Robot {
    baseStats = new Stats();
    adjustedStats = new Stats();
    slots: Slot[] = [];
    items: Item[] = [];

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
    ]

    this.baseStats.triggerPower = 1;
    this.baseStats.triggerTime = 10;
    this.baseStats.triggerRange = 1;

    this.baseStats.backgroundPower = 0;
    }
}

class Humanoid extends Robot {

    constructor(slots: Slot[], items: Item[]) {
        super();
        this.slots = slots;
        var ID: number; 
        
        this.adjustedStats.copy(this.baseStats, true);
        
        // Add slots
        ID = this.slots.findLastIndex(d => d.name === "Battery Slot");
        if(ID >= 0) this.slots[ID].count ++;

        ID = slots.findLastIndex(d => d.name === "Weapon Slot");
        if(ID >= 0) this.slots[ID].count ++;

        ID = slots.findLastIndex(d => d.name === "Weapon Slot");
        if(ID >= 0) this.slots[ID].count ++;

        // Add items
        ID = items.findLastIndex(d => d.name === "Battery");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Blaster");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Shield");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Vorpal Sword");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Vorpal Sword");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));    
    }
}

class Tile {
    name: string;
    key: string;
    sprite: Vector;
    transparent: boolean;
    speed: number;

    constructor(name: string, key: string, sprite: Vector, transparent: boolean, speed: number){
        this.name = name;
        this.key = key;
        this.sprite = sprite;
        this.transparent = transparent;
        this.speed = speed;
    }
}

class WorldData {
    maxRobotCount: number = 10;
    size: Vector = new Vector(10, 10);
    itemSprite = new Vector(18, 27);
    sketch: string[] = [];
    entrances: Vector[] = [];
    tiles: Tile[] = [];
    slots: Slot[] = [];
    items: Item[] = [];
    robots: Robot[] = [];

    constructor() {
    }
}
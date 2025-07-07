 
class Item {   
    name: string;
    stats: Stats;
    timeToEquip: number = 10;
    isEquipped: boolean = false;

    constructor(name: string, effects: Stats) {
        this.name = name;
        this.stats = effects;
    }
}

class Stats {
    worth = 0;
    bulk = 0;

    // generatorPower = 0;
    // batteryPower = 0;
    // batteryCapacity = 0;

    elements: string[] = [];

    armor: number[] = [];

    maxCarry = 0;
    maxEquip = 0;

    // scanCost = 0;
    scanTime = 0;
    scanRange = 0;

    // attackCost = 0;
    attackTime = 0;
    attack: number[] = [];

    // shieldCost = 0;
    shield: number[] = [];

    // moveCost = 0;
    moveTime = 0;
    permissiveTerrain: string[] = [];

    constructor() {
        this.elements.push('Kinetic');
        this.elements.push('Thermal');
        this.elements.push('ElectroMagnetic');

        for(var i = 0; i < this.elements.length ; i ++) {
            this.armor.push(0);
            this.shield.push(0);
            this.attack.push(0);
        }

    }

    add(stats: Stats) {
        this.worth += stats.worth;
        this.bulk += stats.bulk;

        for(var i = 0; i < this.elements.length; i ++) {
            this.armor[i] += stats.armor[i];
            this.shield[i] += stats.shield[i];
            this.attack[i] += stats.attack[i];
        }

        this.maxCarry += stats.maxCarry;
        this.maxEquip += stats.maxEquip;

        // this.generatorPower += stats.generatorPower;
        // this.batteryCapacity += stats.batteryCapacity;

        // this.scanCost += stats.scanCost;
        this.scanTime += stats.scanTime;
        this.scanRange += stats.scanRange;

        // this.attackCost += stats.attackCost;
        this.attackTime += stats.attackTime;

        // this.shieldCost += stats.shieldCost;

        // this.moveCost += stats.moveCost;
        this.moveTime += stats.moveTime;
        for(var i = 0; i < stats.permissiveTerrain.length; i ++) {
            this.permissiveTerrain.push(stats.permissiveTerrain[i]);
        }
    } 

    copy(stats: Stats) {
        this.worth = stats.worth;
        this.bulk = stats.bulk;

        // this.batteryCapacity = stats.batteryCapacity;
        // this.generatorPower = stats.generatorPower;

        for(var i = 0; i < this.elements.length ; i ++) {
            this.armor[i] = stats.armor[i];
            this.shield[i] = stats.shield[i];
            this.attack[i] = stats.attack[i];
        }

        this.maxCarry = stats.maxCarry;
        this.maxEquip = stats.maxEquip;

        // this.scanCost = stats.scanCost;
        this.scanTime = stats.scanTime;
        this.scanRange = stats.scanRange;

        // this.attackCost = stats.attackCost;
        this.attackTime = stats.attackTime;

        // this.shieldCost = stats.shieldCost;

        // this.moveCost = stats.moveCost;
        this.moveTime = stats.moveTime;
        this.permissiveTerrain = stats.permissiveTerrain;
    } 
}

class Robot {
    baseStats = new Stats();
    stats = new Stats();
    items: Item[] = [];

    constructor(items: Item[]) {

        this.baseStats.maxCarry = 8;
        this.baseStats.maxEquip = 4;

        // this.baseStats.moveCost = 3;
        this.baseStats.moveTime = 10;
        this.baseStats.permissiveTerrain = [
            'Floor',
            'Door'
        ]

                var ID: number; 
        
        this.stats.copy(this.baseStats);

        // Add items
        ID = items.findLastIndex(d => d.name === "Battery");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Blaster");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Shield");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Scanner");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Armor");
        if(ID >= 0) this.items.push(structuredClone(items[ID])); 
    }
}

// class Humanoid extends Robot {

//     constructor(items: Item[]) {
//         super(); 
//         var ID: number; 
        
//         this.stats.copy(this.baseStats);

//         // Add items
//         ID = items.findLastIndex(d => d.name === "Battery");
//         if(ID >= 0) this.items.push(structuredClone(items[ID]));

//         ID = items.findLastIndex(d => d.name === "Blaster");
//         if(ID >= 0) this.items.push(structuredClone(items[ID]));

//         ID = items.findLastIndex(d => d.name === "Shield");
//         if(ID >= 0) this.items.push(structuredClone(items[ID]));

//         ID = items.findLastIndex(d => d.name === "Scanner");
//         if(ID >= 0) this.items.push(structuredClone(items[ID]));

//         ID = items.findLastIndex(d => d.name === "Armor");
//         if(ID >= 0) this.items.push(structuredClone(items[ID]));    
//     }
// }

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
    // slots: Slot[] = [];
    items: Item[] = [];
    robots: Robot[] = [];

    constructor() {
    }
}
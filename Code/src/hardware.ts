 
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

    elements: string[] = [];

    armor: number[] = [];

    maxCarry = 0;
    maxEquip = 0;

    scanTime = 0;
    scanRange = 0;

    attack: number[] = [];

    shield: number[] = [];

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

        this.scanTime += stats.scanTime;
        this.scanRange += stats.scanRange;

        for(var i = 0; i < stats.permissiveTerrain.length; i ++) {
            this.permissiveTerrain.push(stats.permissiveTerrain[i]);
        }
    } 

    copy(stats: Stats) {
        this.worth = stats.worth;
        this.bulk = stats.bulk;

        for(var i = 0; i < this.elements.length ; i ++) {
            this.armor[i] = stats.armor[i];
            this.shield[i] = stats.shield[i];
            this.attack[i] = stats.attack[i];
        }

        this.maxCarry = stats.maxCarry;
        this.maxEquip = stats.maxEquip;

        this.scanTime = stats.scanTime;
        this.scanRange = stats.scanRange;

        // Copy the list so later add() calls don't change the source stats.
        this.permissiveTerrain = [...stats.permissiveTerrain];
    } 

    getActionTime() {
        return this.bulk;
    }
}

class Robot {   
    baseStats = new Stats();
    stats = new Stats();
    items: Item[] = [];

    constructor(items: Item[]) {

        this.baseStats.maxCarry = 8;
        this.baseStats.maxEquip = 4;

        // Robots have an inherent worth and bulk
        this.baseStats.worth = 10;
        this.baseStats.bulk = 4;

        this.baseStats.permissiveTerrain = [
            'Floor',
            'Door',
            'Nest'
        ]

        var ID: number; 
        
        this.stats.copy(this.baseStats);

        // Add items
        ID = items.findLastIndex(d => d.name === "Blaster");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Scanner");
        if(ID >= 0) this.items.push(structuredClone(items[ID]));

        ID = items.findLastIndex(d => d.name === "Armor");
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
    items: Item[] = [];
    robots: Robot[] = [];

    // Late-game settings (in ticks). A new random item appears every
    // itemSpawnInterval ticks, and a destroyed robot comes back at its nest
    // respawnDelay ticks after it died. Set either to 0 to turn it off.
    startingItems = 10;
    itemSpawnInterval = 500;
    respawnDelay = 500;

    // A respawned robot can't be damaged for this many ticks, unless it
    // attacks first. 0 turns protection off.
    respawnProtection = 100;

    // Combat settings. A shield can block at most this fraction of each
    // element's damage per hit. While a robot stands on its nest, its
    // equipped armor regains 1 point per element every nestRepairInterval
    // ticks, up to the item's original armor (0 turns repair off).
    maxShieldBlock = 0.5;
    nestRepairInterval = 15;

    constructor() {
    }
}
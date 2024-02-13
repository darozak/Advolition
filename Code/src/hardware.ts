class Equipment {
    name: string;
    mass: number = 0;
    power: number[];
    speed: number[];
    type: string;

    constructor(name: string, type: string, mass:number, power: number[], speed: number[]) {
        this.name = name;
        this.type = "equipment";
        this.mass = mass;
        this.speed = speed;
        while(this.speed.length < 3) this.speed.push(0);
        this.power = power;
        while(this.power.length < 3) this.power.push(0);
    }
}

class Scanner extends Equipment {
    range: number[];

    constructor(name: string, mass: number, power: number[], speed: number[], range: number[]) {
        super(name, "scanner", mass, power, speed);
        this.range = range;
        while(this.range.length < 3) this.range.push(0);
    }
}

class Shield extends Equipment {
    resistance: number[];

    constructor(name: string, mass: number, power: number[], speed: number[], resistance: number[]) {
        super(name, "shield", mass, power, speed);
        this.resistance = resistance;
        while(this.resistance.length < 3) this.resistance.push(0);
    }
}

class Weapon extends Equipment {
    damage: number[];
    range: number[];

    constructor(name: string, mass: number, power: number[], speed: number[],  damage: number[], range: number[]) {
        super(name, "weapon", mass, power, speed);
        this.damage = damage;
        while(this.damage.length < 3) this.damage.push(0);
        this.range = range;
        while(this.range.length < 3) this.range.push(0);
    }
}

class Core extends Equipment {
    constructor(name: string, mass: number, power: number[], speed: number[]) {
        super(name, "core", mass, power, speed);
    }
}

class Battery {
    name: string;
    mass: number = 0;
    type: string;
    currentPower: number;
    maxPower: number;

    constructor(name: string, mass:number, maxPower: number) {
        this.name = name;
        this.type = "battery";
        this.mass = mass;
        this.maxPower = maxPower;
        this.currentPower = maxPower;
    }
}

class Chassis {
    name: string;
    sprite: Vector;
    mass: number = 0;
    type: string;
    HPs: number;
    maxHPs: number;

    constructor(name: string, sprite: Vector, mass:number, maxHPS: number) {
        this.name = name;
        this.sprite = sprite;
        this.type = "chassis";
        this.mass = mass;
        this.maxHPs = maxHPS;
        this.HPs = maxHPS;
    }
}
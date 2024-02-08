class Equipment {
    #name: string;
    #mass: number = 0;
    #power: number[];
    #speed: number[];
    #type: string;

    constructor(name: string, type: string, mass:number, power: number[], speed: number[]) {
        this.#name = name;
        this.#type = "equipment";
        this.#mass = mass;
        this.#speed = speed;
        while(this.#speed.length < 3) this.#speed.push(0);
        this.#power = power;
        while(this.#power.length < 3) this.#power.push(0);
    }

    power(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#power[powerLevel];
        else return this.#power[0];
    }

    speed(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#speed[powerLevel];
        else return this.#speed[0];
    }

    get mass() {
        return this.#mass;
    }

    get type() {
        return this.#type;
    }

    get name() {
        return this.#name;
    }
}

class Scanner extends Equipment {
    #range: number[];

    constructor(name: string, mass: number, power: number[], speed: number[], range: number[]) {
        super(name, "scanner", mass, power, speed);
        this.#range = range;
        while(this.#range.length < 3) this.#range.push(0);
    }

    range(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#range[powerLevel];
        else return this.#range[0];
    }
}

class Shield extends Equipment {
    #resistance: number[];

    constructor(name: string, mass: number, power: number[], speed: number[], resistance: number[]) {
        super(name, "shield", mass, power, speed);
        this.#resistance = resistance;
        while(this.#resistance.length < 3) this.#resistance.push(0);
    }

    resistance(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#resistance[powerLevel];
        else return this.#resistance[0];
    }
}

class Weapon extends Equipment {
    #damage: number[];
    #range: number[];

    constructor(name: string, mass: number, power: number[], speed: number[],  damage: number[], range: number[]) {
        super(name, "weapon", mass, power, speed);
        this.#damage = damage;
        while(this.#damage.length < 3) this.#damage.push(0);
        this.#range = range;
        while(this.#range.length < 3) this.#range.push(0);
    }

    damage(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#damage[powerLevel];
        else return this.#damage[0];
    }

    range(powerLevel: number) {
        if(powerLevel >= 0 && powerLevel < 3) return this.#range[powerLevel];
        else return this.#range[0];
    }
}

class Core extends Equipment {
    constructor(name: string, mass: number, power: number[], speed: number[]) {
        super(name, "core", mass, power, speed);
    }
}

class Battery {
    #name: string;
    #mass: number = 0;
    #type: string;
    #currentPower: number;
    #maxPower: number;

    constructor(name: string, mass:number, maxPower: number) {
        this.#name = name;
        this.#type = "battery";
        this.#mass = mass;
        this.#maxPower = maxPower;
        this.#currentPower = maxPower;
    }

    clone() {
        // Required to copy private variables.
        return new Battery(this.#name, this.#mass, this.#maxPower); 
    }

    usePower(amount: number) {
        if(amount <= this.#currentPower) {
            this.#currentPower -= amount;
            return true;
        } else {
            this.#currentPower = 0;
            return false;
        }
    }
  
    get power() {
        return this.#currentPower;
    }

    get maxPower() {
        return this.#maxPower;
    }

    get mass() {
        return this.#mass;
    }

    get type() {
        return this.#type;
    }

    get name() {
        return this.#name;
    }
}
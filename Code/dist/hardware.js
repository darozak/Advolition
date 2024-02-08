"use strict";
class Equipment {
    #name;
    #mass = 0;
    #power;
    #speed;
    #type;
    constructor(name, type, mass, power, speed) {
        this.#name = name;
        this.#type = "equipment";
        this.#mass = mass;
        this.#speed = speed;
        while (this.#speed.length < 3)
            this.#speed.push(0);
        this.#power = power;
        while (this.#power.length < 3)
            this.#power.push(0);
    }
    power(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#power[powerLevel];
        else
            return this.#power[0];
    }
    speed(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#speed[powerLevel];
        else
            return this.#speed[0];
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
    #range;
    constructor(name, mass, power, speed, range) {
        super(name, "scanner", mass, power, speed);
        this.#range = range;
        while (this.#range.length < 3)
            this.#range.push(0);
    }
    range(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#range[powerLevel];
        else
            return this.#range[0];
    }
}
class Shield extends Equipment {
    #resistance;
    constructor(name, mass, power, speed, resistance) {
        super(name, "shield", mass, power, speed);
        this.#resistance = resistance;
        while (this.#resistance.length < 3)
            this.#resistance.push(0);
    }
    resistance(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#resistance[powerLevel];
        else
            return this.#resistance[0];
    }
}
class Weapon extends Equipment {
    #damage;
    #range;
    constructor(name, mass, power, speed, damage, range) {
        super(name, "weapon", mass, power, speed);
        this.#damage = damage;
        while (this.#damage.length < 3)
            this.#damage.push(0);
        this.#range = range;
        while (this.#range.length < 3)
            this.#range.push(0);
    }
    damage(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#damage[powerLevel];
        else
            return this.#damage[0];
    }
    range(powerLevel) {
        if (powerLevel >= 0 && powerLevel < 3)
            return this.#range[powerLevel];
        else
            return this.#range[0];
    }
}
class Core extends Equipment {
    constructor(name, mass, power, speed) {
        super(name, "core", mass, power, speed);
    }
}
class Battery {
    #name;
    #mass = 0;
    #type;
    #currentPower;
    #maxPower;
    constructor(name, mass, maxPower) {
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
    usePower(amount) {
        if (amount <= this.#currentPower) {
            this.#currentPower -= amount;
            return true;
        }
        else {
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
class Chassis {
    #name;
    #sprite;
    #mass = 0;
    #type;
    #currentHPs;
    #maxHPs;
    constructor(name, sprite, mass, maxHPS) {
        this.#name = name;
        this.#sprite = sprite;
        this.#type = "chassis";
        this.#mass = mass;
        this.#maxHPs = maxHPS;
        this.#currentHPs = maxHPS;
    }
    clone() {
        // Required to copy private variables.
        return new Chassis(this.#name, this.#sprite, this.#mass, this.#maxHPs);
    }
    takeDamage(amount) {
        if (amount <= this.#currentHPs) {
            this.#currentHPs -= amount;
            return true;
        }
        else {
            this.#currentHPs = 0;
            return false;
        }
    }
    isAlive() {
        return this.#currentHPs > 0;
    }
    get sprite() {
        return this.#sprite;
    }
    get HPs() {
        return this.#currentHPs;
    }
    get maxHPs() {
        return this.#maxHPs;
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

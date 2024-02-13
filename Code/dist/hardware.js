"use strict";
class Equipment {
    name;
    mass = 0;
    power;
    speed;
    type;
    constructor(name, type, mass, power, speed) {
        this.name = name;
        this.type = "equipment";
        this.mass = mass;
        this.speed = speed;
        while (this.speed.length < 3)
            this.speed.push(0);
        this.power = power;
        while (this.power.length < 3)
            this.power.push(0);
    }
}
class Scanner extends Equipment {
    range;
    constructor(name, mass, power, speed, range) {
        super(name, "scanner", mass, power, speed);
        this.range = range;
        while (this.range.length < 3)
            this.range.push(0);
    }
}
class Shield extends Equipment {
    resistance;
    constructor(name, mass, power, speed, resistance) {
        super(name, "shield", mass, power, speed);
        this.resistance = resistance;
        while (this.resistance.length < 3)
            this.resistance.push(0);
    }
}
class Weapon extends Equipment {
    damage;
    range;
    constructor(name, mass, power, speed, damage, range) {
        super(name, "weapon", mass, power, speed);
        this.damage = damage;
        while (this.damage.length < 3)
            this.damage.push(0);
        this.range = range;
        while (this.range.length < 3)
            this.range.push(0);
    }
}
class Core extends Equipment {
    constructor(name, mass, power, speed) {
        super(name, "core", mass, power, speed);
    }
}
class Battery {
    name;
    mass = 0;
    type;
    currentPower;
    maxPower;
    constructor(name, mass, maxPower) {
        this.name = name;
        this.type = "battery";
        this.mass = mass;
        this.maxPower = maxPower;
        this.currentPower = maxPower;
    }
}
class Chassis {
    name;
    sprite;
    mass = 0;
    type;
    HPs;
    maxHPs;
    constructor(name, sprite, mass, maxHPS) {
        this.name = name;
        this.sprite = sprite;
        this.type = "chassis";
        this.mass = mass;
        this.maxHPs = maxHPS;
        this.HPs = maxHPS;
    }
}

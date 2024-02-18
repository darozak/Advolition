"use strict";
// /**
//  * Items applly all modifiers when equipped.
//  * Howerver they only incur a power cost when triggered by a particular action.
//  * Every time items are re-equipped, all attributes (except HPs and power) will be
//  * reset to the base value, and the mods will be reapplied for equipped items.
//  * This approach will allow the robot to assess it's appilities with respect to
//  * potential actions.  However, the power costs will only be applied if the trigger
//  * action takes place.
//  */
// class Attribute {
//     current: number = 0;
//     base: number = 0;
//     constructor() {}
//     set(current: number) {
//         this.current = current;
//         // this.base = max;
//         // this.isReversable = isReversable;
//     }
//     // init(base: number) {
//     //     this.base = base;
//     //     // this.isResettable = isReversable;
//     // }
//     // applyMod(attribute: Attribute) {
//     //     this.current += attribute.current;
//     //     // this.base += attribute.base;
//     // }
//     // reset() {
//     //     // if(this.isResettable) {
//     //         this.current -= this.base;
//     //     // }
//     // }
// }
// class Attributes {
//     HPs = new Attribute();
//     maxHPs = new Attribute();
//     power = new Attribute();
//     maxPower = new Attribute();
//     damage = new Attribute();
//     defense = new Attribute();
//     moveTime = new Attribute();
//     constructor() {}
//     // applyMods(stats: Attributes) {
//     //     this.HPs.applyMod(stats.HPs);
//     //     this.maxHPs.applyMod(stats.maxHPs);
//     //     this.power.applyMod(stats.power);
//     //     this.maxPower.applyMod(this.maxPower);
//     //     this.damage.applyMod(stats.damage);
//     //     this.defense.applyMod(stats.defense);
//     //     this.moveTime.applyMod(stats.moveTime);
//     // }
//     // resetAttributes() {
//     //     this.HPs.reset();
//     //     this.power.reset();
//     //     this.damage.reset();
//     //     this.defense.reset();
//     //     this.moveTime.reset();
//     // }
// }
// enum Trigger {attacking, defending, moving};
// // enum Attribute {HPs, maxHPs, moveTime, power, maxPower, end};
// enum Slot {shield, weapon};
// // class Slot {
// //     name: string;
// //     timeToEquip: number;
// //     constructor(name: string, timeToEquip: number) {
// //         this.name = name;
// //         this.timeToEquip = timeToEquip;
// //     }
// // }
// // class Trait {
// //     // attribute: Attribute;
// //     effects = new Attributes();
// //     // effect: number;
// //     trigger: Trigger;
// //     // isMultiplied: boolean;
// //     constructor(trigger: Trigger, effects: Attributes) {
// //         this.effects = effects;
// //         this.trigger = trigger;
// //         // this.effect = effect;
// //         // this.isMultiplied = isMultuplied;
// //     }
// // }
// class Item {   
//     name: string;
//     slot: Slot;
//     mass: number;
//     powerTrigger: Trigger;
//     powerCost: number;
//     effects: Attributes;
//     // trait: Trait[] = [];
//     isEquipped: boolean = false;
//     constructor(name: string, slot: Slot, trigger: Trigger, powerCost: number, effects: Attributes, mass: number) {
//         this.name = name;
//         this.slot = slot;
//         this.powerTrigger = trigger;
//         this.powerCost = powerCost;
//         this.effects = effects;
//         this.mass = mass;
//     }
//     // addTrait(trigger: Trigger, effects: Attributes) {
//     //     this.trait.push(new Trait(trigger, effects));
//     // }
// }
/**
 * Robot class contains data on attributes and items.  It includes functions required
 * to equip items and re-evaluate mods.
//  */
// class Robot {
//     stats = new Attributes();
//     // defaultStats: number[] = [];
//     item: Item[] = [];
//     constructor() { }
//     // resetMods() {
//     //     this.stats.resetAttributes();
//     // }
//     // applyMods() {
//     //     this.stats.resetAttributes();
//     //     // Identify equipped items.
//     //     // Apply mods from equipped items.
//     //     for(var i = 0; i < this.item.length; i ++) {
//     //         if(this.item[i].isEquipped) {
//     //             this.stats.applyMods(this.item[i].effects);
//     //         }
//     //     }
//     // }
//     // /**
//     //  * Moves the last of the named items on the equipment list
//     //  * to the top of the equipment list.  It then re-evaluates
//     //  * which items are equipped based on the slots that the robot
//     //  * has available.
//     //  * 
//     //  * @param name 
//     //  */
//     // equip(name: string) {
//     // }
//     // /**
//     //  * Sets the first inactive named item on the equipment list to active.
//     //  *  
//     //  * @param name 
//     //  */
//     // activate(name: string) {
//     // }
//     // /**
//     //  * Sets the first active named item on the equipment list to inactive.
//     //  * 
//     //  * @param name 
//     //  */
//     // inactivate(name: string) {
//     // }
//     // /**
//     //  * Removes the last named item from the inventory and re-evaluates which
//     //  * items are equipped.
//     //  * 
//     //  * @param name 
//     //  */
//     // drop(name: string) {
//     // }
//     // /**
//     //  * Adds the specified item to the end of the robot's inventory.
//     //  * 
//     //  * @param item 
//     //  */
//     // add(item: Item) {
//     // }
//     // removeMods(trigger: Trigger) {
//     //     for(var i = 0; i < this.item.length; i ++) {
//     //         if(this.item[i].isEquipped) {
//     //             if(this.item[i].trigger = trigger) {
//     //                 this.stats.resetAttributes(this.item[i].effects);
//     //             }
//     //         }
//     //     }
//     // }
// }
// class Humanoid extends Robot {
//     constructor() {
//         super();
//         this.stats.HPs.base = 100;
//         this.stats.maxHPs.base = 100;
//         this.stats.power.base = 100;
//         this.stats.maxPower.base = 100;
//         this.stats.moveTime.base = 10;
//         let effects = new Attributes();
//         effects.damage.set(1);
//         var sword = new Item('Vorpal Sword', Slot.shield, Trigger.attacking, 1, effects, 10);
//         this.item.push(sword);
//     }
// }

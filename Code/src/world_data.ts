
class GaiaData extends WorldData {

    constructor() {
        super();

        // Sketch Map
        this.sketch = [
            "##########",
            "#.*......#",
            "#........#",
            "#...&...##",
            "###+######",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            "##########"
        ]

        // Define Entrances
        this.entrances.push(new Vector(1,1));
        this.entrances.push(new Vector(8,8));
        this.entrances.push(new Vector(8,1));
        this.entrances.push(new Vector(1,8));

        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16,31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10,10), false, 0.0));
        this.tiles.push(new Tile("Open Door", "/", new Vector(13,3), true, 1.0));
        this.tiles.push(new Tile("Closed Door", "+", new Vector(12,3), false, 0.0));
        this.tiles.push(new Tile("Power Station", "*", new Vector(18,21), true, 0.0));
        this.tiles.push(new Tile("Repair Bay", "&", new Vector(17,20), true, 0.0));

        // Define Slots
        this.slots.push(new Slot("Battery Slot", 10));
        this.slots.push(new Slot("Weapon Slot", 10));


        // Create Items
        var effects: Stats;

        effects = new Stats();
        effects.kineticDamage = 1;
        this.items.push(new Item('Vorpal Sword', 'Weapon Slot', effects));

        effects = new Stats();
        effects.thermalDamage = 2;
        this.items.push(new Item('Blaster', 'Weapon Slot', effects));

        effects = new Stats();
        effects.thermalDefense = 2;
        this.items.push(new Item('Shield', 'Shield Slot', effects));

        effects = new Stats();
        effects.power = 10;
        effects.maxPower = 10;
        this.items.push(new Item('Battery', 'Battery Slot', effects));

        console.log(this.items);


        // Create New Robot Models
        this.robots[0] = new Humanoid(this.slots, this.items);
        console.log(this.robots[0]);
    }
}


class GaiaData extends WorldData {

    constructor() {
        super();

        // Sketch Map
        this.sketch = [
            "##########",
            "#........#",
            "#........#",
            "#........#",
            "###+######",
            "#........#",
            "#........#",
            "#........#",
            "#........#",
            "##########"
        ]

        // Define Entrances
        this.entrances.push(new Vector(1,1));
        this.entrances.push(new Vector(2,5));
        this.entrances.push(new Vector(8,1));
        this.entrances.push(new Vector(1,8));

        // Create Tiles
        this.tiles.push(new Tile("Floor", ".", new Vector(16,31), true, 1.0));
        this.tiles.push(new Tile("Wall", "#", new Vector(10,10), false, 0.0));
        this.tiles.push(new Tile("Door", "+", new Vector(12,3), false, 0.0));

        // Create Items
        var effects: Stats;

        effects = new Stats();
        effects.scanPower = 0;
        effects.scanRange = 4;
        effects.scanTime = 8;
        this.items.push(new Item('Scanner', effects));

        effects = new Stats();
        effects.thermalDamage = 4;
        this.items.push(new Item('Blaster', effects));

        effects = new Stats();
        effects.thermalDefense = 1;
        this.items.push(new Item('Shield', effects));

        effects = new Stats();
        effects.HPs = 20;
        effects.maxHPs = 20;
        this.items.push(new Item('Armor', effects));

        effects = new Stats();
        effects.power = 50;
        effects.maxPower = 50;
        this.items.push(new Item('Battery', effects));

        console.log(this.items);


        // Create New Robot Models
        this.robots[0] = new Humanoid(this.items);
        console.log(this.robots[0]);
    }
}

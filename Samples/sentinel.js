// Sentinel: a sample robot that guards its nest.
//
// @description Stays home, scans every turn and shoots the nearest robot it can see.
// @designer darozak
// @version 1.0
//
// What it does:
//   1. Equips its Blaster and Armor.
//   2. Scans every turn from its nest.
//   3. Shoots the nearest robot it can see.
class Sentinel extends Program {
    run(myData) {
        const me = myData.robots[myData.myID];
        for (const name of ['Blaster', 'Armor']) {
            const item = me.items.find(i => i.name === name);
            if (item && !item.isEquipped) return new Equip(name);
        }
        let target = null, best = Infinity;
        for (let x = 0; x < myData.mapSize.x; x++) for (let y = 0; y < myData.mapSize.y; y++) {
            const id = myData.robotMap[x][y];
            if (id < 0 || id === myData.myID || myData.scanTime[x][y] !== myData.robots[myData.myID].lastScan) continue;
            const d = Math.abs(x - me.pos.x) + Math.abs(y - me.pos.y);
            if (d < best) { best = d; target = new Vector(x, y); }
        }
        return target ? new Attack(target) : new Scan();
    }
}
new Sentinel();

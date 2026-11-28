// Sentinel: a sample robot that guards its nest.
//
// @description Stays home, scans every turn and shoots the nearest robot it can see.
// @designer Advolition samples
// @version 1.3
//
// What it does:
//   1. Equips its Scanner, Blaster and Armor.
//   2. Scans from its nest.
//   3. Shoots the nearest robot that scan found, and keeps firing while its
//      shots hit. After a miss it scans again, so it never keeps firing at a
//      robot that has moved away.
//      (A tile seen in the latest scan has the same scan time as the
//      Sentinel's own tile.)
class Sentinel extends Program {
    run(myData) {
        const me = myData.robots[myData.myID];
        for (const name of ['Scanner', 'Blaster', 'Armor']) {
            const item = me.items.find(i => i.name === name);
            if (item && !item.isEquipped) return new Equip(name);
        }
        // After a miss, look again before shooting again.
        const last = me.lastAction;
        if (last && last.command === 'attack' && last.status === 'failed') return new Scan();

        const latestScan = myData.scanTime[me.pos.x][me.pos.y];
        let target = null, best = Infinity;
        for (let x = 0; x < myData.mapSize.x; x++) for (let y = 0; y < myData.mapSize.y; y++) {
            const id = myData.robotMap[x][y];
            if (id < 0 || id === myData.myID || myData.scanTime[x][y] !== latestScan) continue;
            const d = Math.abs(x - me.pos.x) + Math.abs(y - me.pos.y);
            if (d < best) { best = d; target = new Vector(x, y); }
        }
        return target ? new Attack(target) : new Scan();
    }
}
new Sentinel();

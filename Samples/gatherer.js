// Gatherer: a sample robot for Advolition.
//
// What it does, in order of priority each turn:
//   1. Equips its gear (Scanner, Armor, Blaster).
//   2. Fights back: if it was shot recently, it fires at the attacker.
//   3. Heads home before time runs out, and stays there.
//   4. Banks loot: on its nest, it drops everything except its gear, because
//      items on your nest count toward your score even if you're destroyed later.
//   5. Picks up any item on its tile.
//   6. Goes home when it's carrying enough loot.
//   7. Walks to the nearest item it knows about.
//   8. Explores toward the nearest unscanned area.
// It scans every few steps so its map stays fresh.
//
// Copy this file and change it to make your own robot. Upload it with one of
// the Robot buttons on the game page.

class Gatherer extends Program {
    constructor() {
        super();
        this.gear = ['Scanner', 'Armor', 'Blaster'];  // equip these, never bank them
        this.lootToCarry = 2;          // go home after picking up this many items
        this.stepsBetweenScans = 3;
        this.stepsSinceScan = 99;      // scan on the first turn
        this.gone = new Set();         // "x,y" tiles whose items we already took or found missing
        this.unreachable = new Set();  // "x,y" targets with no known route
    }

    run(myData) {
        const me = myData.robots[myData.myID];
        const here = new Vector(me.pos.x, me.pos.y);
        const home = new Vector(me.nest.x, me.nest.y);
        const atHome = here.isEqualTo(home);
        const key = (v) => v.x + ',' + v.y;

        // Learn from the last action. If a Take failed, the item is gone, so
        // forget it (our map only updates when we scan).
        const last = me.lastAction;
        if (last && last.command === 'take' && last.status === 'failed') this.gone.add(key(here));

        // 1. Equip any gear we're carrying but haven't equipped.
        for (const name of this.gear) {
            const item = me.items.find(i => i.name === name);
            if (item && !item.isEquipped) return new Equip(name);
        }

        // 2. Fight back for 40 turns after being hit (gameTime counts down).
        const armed = me.stats.attack.some(a => a > 0);
        const hit = me.lastHit;
        if (armed && hit && hit.time - myData.gameTime < 40) {
            const attacker = myData.robots[hit.attackerID];
            const seenSinceHit = attacker && attacker.isAlive && attacker.lastScan <= hit.time;
            const target = seenSinceHit ? attacker.pos : hit.from;
            return new Attack(new Vector(target.x, target.y));
        }

        // Keep the map fresh.
        if (this.stepsSinceScan >= this.stepsBetweenScans) {
            this.stepsSinceScan = 0;
            this.gone.clear();          // a new scan shows what's really there
            this.unreachable.clear();
            return new Scan();
        }

        // 3. Head home with time to spare, then wait there.
        const loot = me.items.filter(i => !this.isGear(me, i));
        const routeHome = findPath(myData, home);
        const turnsHome = (routeHome.length + 2) * (me.stats.bulk + 1) * 1.5;
        if (myData.gameTime < turnsHome + 150) {
            if (atHome) return loot.length > 0 ? new Drop(loot[0].name) : new Scan();
            return this.step(routeHome, home);
        }

        // 4. Bank loot on the nest.
        if (atHome && loot.length > 0) return new Drop(loot[0].name);

        // 5. Pick up items on this tile (but not ones we banked on our nest).
        const itemsHere = myData.itemMap[here.x][here.y];
        if (!atHome && !this.gone.has(key(here)) && itemsHere.length > 0 && me.items.length < me.stats.maxCarry) {
            return new Take(itemsHere[0].name);
        }

        // 6. Go home once we're carrying enough loot.
        if (loot.length >= this.lootToCarry || me.items.length >= me.stats.maxCarry) {
            return this.step(routeHome, home);
        }

        // 7. Walk to the nearest known item.
        const item = this.nearest(myData, here, (x, y) =>
            myData.itemMap[x][y].length > 0 && !(x === home.x && y === home.y) && !this.gone.has(x + ',' + y));
        if (item) return this.goTo(myData, item);

        // 8. Explore: walk to the nearest known tile next to an unscanned one.
        const frontier = this.nearest(myData, here, (x, y) => this.isFrontier(myData, me, x, y));
        if (frontier) return this.goTo(myData, frontier);

        // Nothing left to find: go home and keep watch.
        if (!atHome) return this.step(routeHome, home);
        return new Scan();
    }

    // The first item of each gear type counts as gear; extras are loot.
    isGear(me, item) {
        return this.gear.includes(item.name) && me.items.find(i => i.name === item.name) === item;
    }

    // Walk one step toward a target, marking it unreachable if there's no route.
    goTo(myData, target) {
        let route = findPath(myData, target);
        if (route.length === 0) route = findPath(myData, target, true);   // try through unscanned tiles
        if (route.length === 0) {
            this.unreachable.add(target.x + ',' + target.y);
            return new Scan();
        }
        return this.step(route, target);
    }

    step(route, target) {
        this.stepsSinceScan++;
        if (route.length === 0) return new Move(target);   // no known route: head straight for it
        return new Move(route[0]);
    }

    // The closest tile (in a straight line) that matches a test.
    nearest(myData, from, test) {
        let best = null, bestDistance = Infinity;
        for (let x = 0; x < myData.mapSize.x; x++) {
            for (let y = 0; y < myData.mapSize.y; y++) {
                if (this.unreachable.has(x + ',' + y) || !test(x, y)) continue;
                const distance = from.getDistanceTo(new Vector(x, y));
                if (distance < bestDistance) { best = new Vector(x, y); bestDistance = distance; }
            }
        }
        return best;
    }

    // A tile we can walk on that has an unscanned neighbour.
    isFrontier(myData, me, x, y) {
        const tile = myData.tileMap[x][y];
        if (tile < 0 || !me.stats.permissiveTerrain.includes(myData.tiles[tile].name)) return false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < myData.mapSize.x && ny < myData.mapSize.y && myData.tileMap[nx][ny] < 0) return true;
            }
        }
        return false;
    }
}

new Gatherer();

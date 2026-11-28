// Bulwark: a defender.
//
// @description Builds a fortress: stacks Armor and shields, works only close to home, and stands guard on its nest whenever another robot comes near.
// @designer Advolition samples
// @version 1.0
//
// What it does:
//   1. Keeps Scanner and Blaster equipped, and fills its other two gear slots
//      with Armor and shields it finds.
//   2. Collects items within 12 tiles of its nest and banks them at once.
//   3. If a robot is seen within 6 tiles of its nest, it goes home and
//      fires at the intruder from there.

class Bulwark extends Program {
    constructor() {
        super();
        this.turns = 0;
        this.skip = new Set();
        this.danger = null;
        this.lastHitTime = null;
        this.radius = 12;
    }

    run(d) {
        const me = d.robots[d.myID];
        const here = new Vector(me.pos.x, me.pos.y);
        const home = new Vector(me.nest.x, me.nest.y);
        const atHome = here.isEqualTo(home);
        this.turns++;
        const last = me.lastAction;
        if (last && last.command === 'take' && last.status === 'failed') this.skip.add(here.x + ',' + here.y);
        // Blocked by another robot? Step aside instead of bumping into it again.
        if (last && last.command === 'move' && last.status === 'failed' && /^blocked by/.test(last.reason) && !/Wall/.test(last.reason)) {
            const side = this.sidestep(d, me, here);
            if (side) return new Move(side);
        }

        // Gear: Scanner, Blaster, then the two best defensive items.
        const defensive = me.items.filter(i => i.name === 'Armor' || /Shield/.test(i.name))
            .sort((a, b) => (b.name === 'Armor') - (a.name === 'Armor'));
        const wanted = [me.items.find(i => i.name === 'Scanner'), me.items.find(i => i.name === 'Blaster'), ...defensive.slice(0, 2)].filter(i => i);
        for (const item of wanted) if (!item.isEquipped) return new Equip(item.name);

        const hit = this.noteDanger(d, me, here, 800);
        if (hit && me.lastHit.from) return new Attack(new Vector(me.lastHit.from.x, me.lastHit.from.y));

        // Intruders near the nest, from the latest scan.
        const seenNow = d.scanTime[here.x][here.y];
        let intruder = null, closest = Infinity;
        for (let x = 0; x < d.mapSize.x; x++) {
            for (let y = 0; y < d.mapSize.y; y++) {
                const id = d.robotMap[x][y];
                if (id < 0 || id === d.myID || d.scanTime[x][y] !== seenNow) continue;
                const fromNest = home.getDistanceTo(new Vector(x, y));
                if (fromNest <= 6 && fromNest < closest) { intruder = new Vector(x, y); closest = fromNest; }
            }
        }
        if (intruder) {
            if (!atHome) return this.goTo(d, home);
            if (here.getDistanceTo(intruder) <= me.stats.scanRange) return new Attack(intruder);
        }

        // Bank everything that isn't equipped.
        const loot = me.items.filter(i => !i.isEquipped);
        if (atHome && loot.length > 0) return new Drop(loot[0].name);
        if (this.timeToGoHome(d, me, home)) return atHome ? new Scan() : this.goTo(d, home);

        const best = d.itemMap[here.x][here.y].filter(i => i.stats.worth > 0).sort((a, b) => b.stats.worth - a.stats.worth)[0];
        if (!atHome && best && !this.skip.has(here.x + ',' + here.y) && me.items.length < me.stats.maxCarry) return new Take(best.name);

        if (this.turns % 3 === 1) return new Scan();
        if (loot.length > 0 || me.stats.armor < 40) return this.goTo(d, home);

        const nearHome = (x, y) => home.getDistanceTo(new Vector(x, y)) <= this.radius;
        const item = this.nearest(d, here, (x, y) => nearHome(x, y) && !(x === home.x && y === home.y) && d.itemMap[x][y].some(i => i.stats.worth > 0));
        if (item) return this.goTo(d, item);
        const frontier = this.nearest(d, here, (x, y) => nearHome(x, y) && this.isFrontier(d, me, x, y));
        if (frontier) return this.goTo(d, frontier);
        return atHome ? new Scan() : this.goTo(d, home);
    }

    // ----- Helpers (the same in every sample robot) -----

    // The closest tile, in a straight line, that passes a test. Skips tiles we
    // gave up on and tiles near where we were recently shot from.
    nearest(d, from, test) {
        let best = null, bestDistance = Infinity;
        for (let x = 0; x < d.mapSize.x; x++) {
            for (let y = 0; y < d.mapSize.y; y++) {
                if (this.skip.has(x + ',' + y) || this.dangerous(d, x, y) || !test(x, y)) continue;
                const distance = from.getDistanceTo(new Vector(x, y));
                if (distance < bestDistance) { best = new Vector(x, y); bestDistance = distance; }
            }
        }
        return best;
    }

    // A free tile next to us (tried in a turning order, so we don't keep
    // picking the same one), for getting out of another robot's way.
    sidestep(d, me, here) {
        const steps = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
        for (let k = 0; k < 8; k++) {
            const [dx, dy] = steps[(k + this.turns) % 8];
            const x = here.x + dx, y = here.y + dy;
            if (x < 0 || y < 0 || x >= d.mapSize.x || y >= d.mapSize.y) continue;
            const tile = d.tileMap[x][y];
            if (tile < 0 || !me.stats.permissiveTerrain.includes(d.tiles[tile].name) || d.robotMap[x][y] >= 0) continue;
            return new Vector(x, y);
        }
        return null;
    }

    // A tile we can walk on with an unscanned tile next to it.
    isFrontier(d, me, x, y) {
        const tile = d.tileMap[x][y];
        if (tile < 0 || !me.stats.permissiveTerrain.includes(d.tiles[tile].name)) return false;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx >= 0 && ny >= 0 && nx < d.mapSize.x && ny < d.mapSize.y && d.tileMap[nx][ny] < 0) return true;
            }
        }
        return false;
    }

    // One step toward a target, giving up on targets with no route.
    goTo(d, target) {
        let route = findPath(d, target);
        if (route.length === 0) route = findPath(d, target, true);   // try through unscanned tiles
        if (route.length === 0) { this.skip.add(target.x + ',' + target.y); return new Scan(); }
        return new Move(route[0]);
    }

    // After being hit, remember roughly where the shot came from (lastHit.from
    // is null when the shooter was beyond scan range; lastHit.direction still
    // says which way). Returns true if we were hit in the last 30 ticks.
    noteDanger(d, me, here, keepAway) {
        const hit = me.lastHit;
        const recent = hit && hit.time - d.gameTime < 30;
        if (recent && hit.time !== this.lastHitTime) {
            this.lastHitTime = hit.time;
            const from = hit.from ? new Vector(hit.from.x, hit.from.y)
                : new Vector(here.x + 4 * hit.direction.x, here.y + 4 * hit.direction.y);
            this.danger = { pos: from, until: d.gameTime - keepAway };   // gameTime counts down
        }
        if (this.danger && d.gameTime < this.danger.until) this.danger = null;
        return recent;
    }

    dangerous(d, x, y) {
        return !!this.danger && this.danger.pos.getDistanceTo(new Vector(x, y)) < 5;
    }

    // Time to head home: the walk home (with a margin) is about to take all
    // the time that's left.
    timeToGoHome(d, me, home) {
        const route = findPath(d, home);
        return d.gameTime < (route.length + 2) * (me.stats.bulk + 1) * 1.5 + 150;
    }
}

new Bulwark();

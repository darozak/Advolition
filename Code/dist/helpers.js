"use strict";
/**
 * Helpers that robot programs can use (they are copied into each program's
 * sandbox along with Vector and the action classes).
 */
/**
 * Finds the quickest walking route from the robot's position to `target`,
 * using what the robot knows about the map. Returns the steps to take, not
 * including the robot's own tile, or an empty array if there's no known route.
 * Move along it with `new Move(path[0])`.
 *
 * Unscanned tiles are avoided unless `allowUnknown` is true. Other robots
 * aren't taken into account. Diagonal steps take longer, so the route prefers
 * straight steps when they're just as short.
 */
function findPath(myData, target, allowUnknown = false) {
    const me = myData.robots[myData.myID];
    const width = myData.mapSize.x, height = myData.mapSize.y;
    const sx = Math.round(me.pos.x), sy = Math.round(me.pos.y);
    const tx = Math.round(target.x), ty = Math.round(target.y);
    if (tx < 0 || ty < 0 || tx >= width || ty >= height)
        return [];
    if (sx == tx && sy == ty)
        return [];
    const canEnter = (x, y) => {
        const tile = myData.tileMap[x][y];
        if (tile < 0)
            return allowUnknown;
        return me.stats.permissiveTerrain.includes(myData.tiles[tile].name);
    };
    if (!canEnter(tx, ty))
        return [];
    // Dijkstra's algorithm over the grid. Straight steps cost 1, diagonal steps cost 1.41.
    const cost = new Array(width * height).fill(Infinity);
    const previous = new Array(width * height).fill(-1);
    const done = new Array(width * height).fill(false);
    const start = sx * height + sy, goal = tx * height + ty;
    cost[start] = 0;
    for (;;) {
        let current = -1;
        for (let k = 0; k < cost.length; k++) {
            if (!done[k] && cost[k] < Infinity && (current < 0 || cost[k] < cost[current]))
                current = k;
        }
        if (current < 0)
            return [];
        if (current == goal)
            break;
        done[current] = true;
        const cx = Math.floor(current / height), cy = current % height;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = cx + dx, y = cy + dy;
                if ((dx == 0 && dy == 0) || x < 0 || y < 0 || x >= width || y >= height)
                    continue;
                if (!canEnter(x, y))
                    continue;
                const next = x * height + y;
                const stepCost = (dx != 0 && dy != 0) ? 1.41 : 1;
                if (cost[current] + stepCost < cost[next]) {
                    cost[next] = cost[current] + stepCost;
                    previous[next] = current;
                }
            }
        }
    }
    const path = [];
    for (let k = goal; k != start; k = previous[k]) {
        path.unshift(new Vector(Math.floor(k / height), k % height));
    }
    return path;
}

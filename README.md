# Advolition
## Overview
Advolition is a roguelike game in which 1-4 players program robots that compete to explore a randomly generated dungeon, collect items, and bring their wealth home.

Robots are programmed by uploading a JavaScript class. The game engine runs that class to decide how each robot responds to its surroundings.

Every robot starts out the same. What sets them apart are their programs and the items they find and equip in the dungeon.

You can play the most recent version of the game at https://darozak.github.io/Advolition/

## Playing a game
1. Open the game page.
2. Use the **Robot 1**–**Robot 4** buttons to upload a program file for each robot you want in the game. Empty slots are left out.
3. Click **Run** to start a new game, or **Stop** to end it. Stopping can't be undone: clicking **Run** again starts a new game.

Each robot gets its own panel showing its stats, its event log, a map of what it has scanned, its inventory, and any items on the ground beneath it.

A sample program is included at [`Code/dist/tobor.js`](Code/dist/tobor.js).

## The dungeon
Each game builds a new 25×25 dungeon of rooms and corridors. Every grid space is one of these tiles:

| Tile | Map key | Robots can enter | Robots can see/shoot through |
| ---- | ------- | ---------------- | ---------------------------- |
| Floor | `.` | Yes | Yes |
| Wall | `#` | No | No |
| Door | `+` | Yes | No |
| Nest | `@` | Yes | Yes |

A grid space can hold one robot and any number of items. Ten random items are scattered on floor tiles at the start of each game, and a new random item appears somewhere on the floor every 500 turns.

## Time
The game lasts 10,000 ticks. `gameTime` counts down from 10,000 to 0, and the game stops at 0.

A robot does one action at a time. When its current action is finished, the engine calls its program again to get the next one.

Most actions take a number of ticks equal to the robot's **action time**, which is its total **bulk**. A bare robot has a bulk of 4, and every item it carries (equipped or not) adds its own bulk. A robot with its three starting items has an action time of 10. Diagonal moves take about 1.4 times as long.

Actions that finish on the same turn happen in a random order, so no robot always goes first.

If a program returns an action that can't be started (for example, equipping an item it doesn't have), nothing is queued and the program is called again on the next tick.

## Robots
Every robot starts with:

| Stat | Value |
| ---- | ----- |
| Worth | 10 |
| Bulk | 4 |
| Max items carried | 8 |
| Max items equipped | 4 |
| Passable terrain | Floor, Door, Nest |

Each robot also starts with a **Blaster**, **Scanner** and **Armor** in its inventory. These items are **not equipped** at the start, so a robot's program should equip them before it scans or fights.

A robot's stats are its base stats plus the stats of all its equipped items. Worth and bulk are the exception: every carried item counts toward them, equipped or not.

## Items
| Item | Worth | Bulk | Effect when equipped |
| ---- | ----- | ---- | -------------------- |
| Scanner | 10 | 3 | Scan range +4 |
| Blaster | 20 | 2 | Thermal attack +4 |
| Shield | 5 | 4 | Thermal shield +1 |
| Armor | 6 | 1 | 60 armor against each element |

Without an equipped Scanner, a robot's scan range is 0.

Each item is defined as its own subclass of `Item` in [`Code/src/items.ts`](Code/src/items.ts). To add an item, create a new subclass there and add it to the item list in `Code/src/world_data.ts`.

## Fighting
There are three damage elements: **Kinetic**, **Thermal** and **ElectroMagnetic**. Each robot has an attack, shield and armor value for each one.

An attack travels in a straight line toward the target position and hits the first robot in its path. Walls and doors block it, but a robot standing in a doorway can still be hit. There is no range limit.

For each element:
1. The defender's **shield** is subtracted from the attacker's **attack**.
2. The defender's equipped **armor** absorbs what's left. Armor wears down by the amount it absorbs, so it eventually runs out.
3. If any damage gets past the armor, the defender is destroyed. It drops all of its items where it stood and is removed from the map.

A destroyed robot respawns at its nest 500 turns later, with no items. It waits if another robot is standing on its nest. Items it banked on its nest are still there to pick up again.

## Scoring
The tile where a robot starts becomes its **nest**. A robot's score is:

- the worth of all items lying on its nest, plus
- the robot's own worth (base worth plus everything it's carrying), if it is standing on its nest. Other robots standing on your nest don't add to your score.

Scores are shown live in each robot's panel. When time runs out, the winner (or a tie) is announced at the top of the screen.

Starting positions are spread out: each nest is placed as far as possible (by walking distance) from the others, out of their line of sight, and on an empty tile.

## Programming your robot
A program file must define a class that extends `Program`, give it a `run` method that takes the robot's scan data and returns an action, and end with an expression that creates an instance of the class.

Here is the most basic "Hello world!" program:
```javascript
class MyProgram extends Program {
    run(myData) {
        return new Say('Hello world!');
    }
}
new MyProgram();
```

The same program instance is used for the whole game, so it can keep state in its own fields between calls.

Here is a slightly more useful start:
```javascript
class Starter extends Program {
    constructor() {
        super();
        this.queue = [new Equip('Scanner'), new Equip('Blaster'), new Equip('Armor')];
    }

    run(myData) {
        if (this.queue.length > 0) return this.queue.shift();
        return new Scan();
    }
}
new Starter();
```

If a program throws an error, that robot does nothing for that turn and the error appears in its log. If a file has an error or doesn't end by creating the program, that robot is left out of the game and a message explains why.

### The sandbox
Each program runs in its own sandbox (a Web Worker), separate from the game and from the other robots' programs.
- A program can use `Program`, `Vector` and the action classes below. It can't see the game, the page, or other programs. The only information it gets is the `myData` passed to `run`.
- `console.log` output appears in the browser's developer console.
- A program has 1 second to load and 1 second to choose each action. If it takes longer, it is stopped and its robot does nothing for the rest of the game.
- Each turn waits until every program that is choosing an action has answered, so a slow program slows the whole game.

## Actions
A program's `run` method returns one of these:

| Action | What it does |
| ------ | ------------ |
| `new Move(target)` | Moves one step toward the `target` Vector. If the next tile isn't passable or another robot is standing on it, the robot stays put. |
| `new Scan()` | Updates the robot's map within its scan range. Walls and doors block line of sight. |
| `new Take(itemName)` | Picks up the named item from the robot's tile, if it has room. |
| `new Drop(itemName)` | Drops the named item onto the robot's tile. |
| `new Equip(itemName)` | Equips the named item. If this goes over the limit of 4, the item equipped longest ago is unequipped. |
| `new Unequip(itemName)` | Unequips the named item. |
| `new Attack(target)` | Attacks along a straight line toward the `target` Vector. |
| `new Say(message)` | Writes a message to the robot's log. Takes no time. |

Positions use the `Vector` class: `new Vector(x, y)`. `Move` and `Attack` targets are rounded to the nearest whole tile. It has helpers such as `add`, `subtract`, `isEqualTo`, `getDistanceTo` and `getPathTo`.

## myData
`run` receives a fresh copy of the robot's scan data each time. Because it is a copy, positions inside it are plain `{x, y}` objects without `Vector` methods. Use `new Vector(p.x, p.y)` if you need them.

### ScanData
| Field | Type | Description |
| ----- | ---- | ----------- |
| `gameTime` | number | Ticks left in the game. |
| `myID` | number | This robot's ID. Use `robots[myID]` for its own data. |
| `mapSize` | Vector | The width and height of the map. |
| `tileMap[x][y]` | number | The tile ID at x, y, or -1 if it hasn't been scanned. |
| `tiles[n]` | Tile | Details for tile ID `n`. |
| `itemMap[x][y]` | Item[] | Items seen at x, y as of the last scan there. |
| `robotMap[x][y]` | number | The ID of the robot seen at x, y, or -1 for none. |
| `robots[n]` | RobotData | What this robot knows about robot `n`. Its own entry is always current. Others are as of the last time they were scanned, and `undefined` until then. |
| `robotCount` | number | How many robots are in the game. Robot IDs run from 0 to `robotCount - 1`. |
| `scanTime[x][y]` | number | The `gameTime` when x, y was last scanned, or -1 if it hasn't been scanned. |

### RobotData
| Field | Type | Description |
| ----- | ---- | ----------- |
| `robotID` | number | The robot's ID. |
| `name` | string | The robot's display name. |
| `isAlive` | boolean | False once the robot has been destroyed. |
| `pos` | Vector | Current position. |
| `nest` | Vector | Home tile position. |
| `stats` | Stats | Current stats: base plus equipped items, with worth and bulk counting all carried items. |
| `baseStats` | Stats | Stats with no items equipped. |
| `items` | Item[] | Inventory. Equipped items come first. |
| `lastScan` | number | The `gameTime` when this data was recorded. |

### Stats
Arrays indexed by element use 0 = Kinetic, 1 = Thermal, 2 = ElectroMagnetic.

| Field | Type | Description |
| ----- | ---- | ----------- |
| `worth` | number | Value counted toward the score. |
| `bulk` | number | Weight. A robot's total bulk is its action time. |
| `attack[e]` | number[] | Damage dealt per element. |
| `shield[e]` | number[] | Damage blocked per element. |
| `armor[e]` | number[] | Damage absorbed per element. Wears down when used. |
| `scanRange` | number | How far a scan reaches. |
| `maxCarry` | number | Maximum items carried. |
| `maxEquip` | number | Maximum items equipped. |
| `permissiveTerrain` | string[] | Tile names the robot can move onto. |

### Item
| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | Item name, used by `Take`, `Drop`, `Equip` and `Unequip`. |
| `stats` | Stats | What the item adds when equipped. |
| `isEquipped` | boolean | True if the item is equipped. |

### Tile
| Field | Type | Description |
| ----- | ---- | ----------- |
| `name` | string | `Floor`, `Wall`, `Door` or `Nest`. |
| `key` | string | The map character for the tile. |
| `transparent` | boolean | True if scans and attacks can pass through. |

## Tuning the game
The late-game settings are on `WorldData` in `Code/src/hardware.ts`:

| Setting | Default | What it does |
| ------- | ------- | ------------ |
| `startingItems` | 10 | Items on the map at the start. |
| `itemSpawnInterval` | 500 | Turns between new random items. 0 turns this off. |
| `respawnDelay` | 500 | Turns before a destroyed robot respawns. 0 turns respawning off. |

## Building from source
The game is written in TypeScript in `Code/src/` and compiled to `Code/dist/`, which `index.html` loads directly. To rebuild after changing the source:

```
cd Code
npx -p typescript tsc -p .
```

Commit the updated `Code/dist/` files along with the source changes, since GitHub Pages serves them as-is.

"use strict";
class Game {
    gameTime;
    duration;
    world;
    arena;
    events = [];
    // Every log entry for each robot, for downloading after a game.
    // Repeats in a row are collapsed into one line with a count.
    fullLogs = [];
    // For the spectator view: each robot's colour, kills and deaths, recent
    // events (kills and respawns), and recent shots to draw on the map.
    static robotColours = [[235, 87, 87], [86, 156, 255], [96, 205, 110], [240, 200, 60]];
    kills = [];
    deaths = [];
    events_feed = [];
    shots = [];
    scoreHistory = []; // each robot's score, every scoreSampleTicks ticks
    scoreSampleTicks = 100;
    panelTop = 480; // where the robot panels start, below the spectator view
    programs = [];
    scanData = [];
    paper;
    sysTime = new Date();
    powerColor = [];
    hpsColor = [];
    chassisColor = [];
    coreColor = [];
    scannerColor = [];
    batteryColor = [];
    constructor(world, duration) {
        this.gameTime = duration;
        this.duration = duration;
        this.world = world;
        this.arena = new Arena(this.world);
        this.arena.generateMap();
        this.paper = new Paper(14);
    }
    // Uploaded programs should be passed in as a SandboxedBot. A plain Program
    // runs in the page without a sandbox (for built-in robots and tests).
    addRobot(robot, name, isDisplayed) {
        this.programs.push('decide' in robot ? robot : new LocalBot(robot));
        let robotID = this.programs.length - 1;
        this.arena.robots.push(new RobotData(this.world, robotID, name, isDisplayed));
        this.scanData.push(new ScanData(this.world, this.arena.robots[robotID]));
        // Choose nests for all robots so far (they start on their nests).
        this.arena.placeNests();
        // Equip items
        this.equipItems(this.arena.robots[robotID]);
        this.kills.push(0);
        this.deaths.push(0);
        this.powerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.hpsColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.chassisColor.push(new RampedArray([180, 180, 180], [235, 64, 52], [3, 3, 3]));
        this.coreColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.scannerColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
        this.batteryColor.push(new RampedArray([180, 180, 180], [51, 110, 156], [3, 3, 3]));
    }
    // Plays one tick. Pass draw = false to skip redrawing the screen (used to
    // play faster than one frame per tick); the final tick is always drawn.
    async run(draw = true) {
        if (this.gameTime > 0) {
            // Decrement game time
            this.gameTime--;
            // Late game: new items appear, and destroyed robots come back.
            this.spawnItems();
            this.respawnRobots();
            this.recordScores();
            this.repairAtNests();
            // Ask every robot that is alive and not busy for its next action.
            // Programs run in their own sandboxes, so they think in parallel.
            let deciding = [];
            let decisions = [];
            for (var i = 0; i < this.programs.length; i++) {
                if (this.arena.robots[i].isAlive && !this.events.some(d => d.robotID == i)) {
                    // Make sure the robot's personal data is up to date in scanData.
                    this.scanData[i].robots[i] = structuredClone(this.arena.robots[i]);
                    this.scanData[i].robots[i].lastScan = this.gameTime;
                    this.scanData[i].gameTime = this.gameTime;
                    this.scanData[i].robotCount = this.programs.length;
                    deciding.push(i);
                    decisions.push(this.programs[i].decide(this.scanData[i]));
                }
            }
            let results = await Promise.all(decisions);
            for (var k = 0; k < deciding.length; k++) {
                var i = deciding[k];
                {
                    // If the program threw, the robot does nothing this turn
                    // and the error goes in its log.
                    let result = results[k];
                    if (result.error !== undefined) {
                        let entry = result.error.startsWith('Program stopped') ? result.error : `Program error: ${result.error}`;
                        let robot = this.arena.robots[i];
                        if (robot.logEntry[robot.logEntry.length - 1] != entry) {
                            this.appendToLog(robot, this.gameTime, entry);
                            console.error(`${robot.name}: ${result.error}`);
                        }
                    }
                    let action = this.checkAction(i, result.action);
                    if (result.error !== undefined) {
                        this.setActionResult(i, '', result.error);
                    }
                    else if (!action) {
                        this.setActionResult(i, '', 'not a valid action');
                    }
                    if (action) {
                        switch (action.command) {
                            case "attack":
                                this.requestAttack(i, action);
                                break;
                            case "drop":
                                this.requestDrop(i, action);
                                break;
                            case "take":
                                this.requestTake(i, action);
                                break;
                            case "activate":
                                this.requestEquip(i, action);
                                break;
                            case "inactivate":
                                this.requestUnequip(i, action);
                                break;
                            case "move":
                                this.requestMove(i, action);
                                break;
                            case "say":
                                this.requestSay(i, action);
                                break;
                            case "scan":
                                this.requestScan(i, action);
                                break;
                            case "":
                                // A plain Action() means "do nothing".
                                break;
                            default:
                                this.setActionResult(i, action.command, `unknown command "${action.command}"`);
                        }
                    }
                }
            }
            // Then resolve and remove any actions that are occuring now.
            if (this.events.length > 0) {
                // Sort the events in reverse chronological order. Ties go in random order.
                this.events.sort((a, b) => (b.duration - a.duration) || (a.tieBreak - b.tieBreak));
                // Evaluate any events that should have occurred by now.
                while (this.events[0].duration >= this.gameTime) {
                    switch (this.events[0].action.command) {
                        case "attack":
                            this.resolveAttack(this.events[0]);
                            break;
                        case "drop":
                            this.resolveDrop(this.events[0]);
                            break;
                        case "take":
                            this.resolveTake(this.events[0]);
                            break;
                        case "activate":
                            this.resolveEquip(this.events[0]);
                            break;
                        case "inactivate":
                            this.resolveUnequip(this.events[0]);
                            break;
                        case "move":
                            this.resolveMove(this.events[0]);
                            break;
                        case "say":
                            this.resolveSay(this.events[0]);
                            break;
                        case "scan":
                            this.resolveScan(this.events[0]);
                            break;
                    }
                    // Remove the processed event break if this was the last event.
                    this.events.shift();
                    if (this.events.length == 0)
                        break;
                }
            }
            // Redraw the game window.
            if (draw || this.gameTime == 0) {
                this.paper.erasePaper();
                this.displaySpectator();
                for (var i = 0; i < this.arena.robots.length; i++) {
                    this.displayRobotStats(i);
                }
            }
            // When time runs out, announce the result.
            if (this.gameTime == 0)
                this.showResult();
        }
    }
    showResult() {
        let robots = this.arena.robots;
        if (robots.length == 0)
            return;
        let scores = robots.map((r, i) => this.arena.getScore(i));
        let best = Math.max(...scores);
        let winners = robots.filter((r, i) => scores[i] == best).map(r => r.name);
        let text = winners.length == 1
            ? `GAME OVER: ${winners[0]} wins with a score of ${best}`
            : `GAME OVER: Tie between ${winners.join(' and ')} with a score of ${best}`;
        this.paper.drawBanner(10, 22, text, [255, 215, 0]);
        console.log(text);
    }
    displayRobotStats(robotID) {
        if (this.arena.robots[robotID].isDisplayed) {
            var spriteWidth = 10;
            var mapRadius = 7;
            var mapFrameSize = (mapRadius * 2 + 1) * spriteWidth;
            var attributeDisplayWidth = 190;
            var robotDisplayWidth = mapFrameSize + attributeDisplayWidth;
            var leftDisplayFrame = 10 - (robotDisplayWidth + 10);
            for (var i = 0; i <= robotID; i++) {
                if (this.arena.robots[i].isDisplayed)
                    leftDisplayFrame += (robotDisplayWidth + 10);
            }
            var topDisplayFrame = this.panelTop;
            var lineSpacing = 15;
            var x0 = this.arena.robots[robotID].pos.x - mapRadius;
            var y0 = this.arena.robots[robotID].pos.y - mapRadius;
            var x1 = this.arena.robots[robotID].pos.x + mapRadius;
            var y1 = this.arena.robots[robotID].pos.y + mapRadius;
            // Display text
            let statRGB = [180, 180, 180];
            let red = [255, 0, 0];
            // Display stats to left of map.
            let centerTextFrame = leftDisplayFrame + 120;
            let topTextFrame = topDisplayFrame + 10;
            // The robot's name, in its colour.
            this.paper.drawText(leftDisplayFrame + 10, topTextFrame, this.arena.robots[robotID].name, this.colourOf(robotID), 'left', 'bold 14px Arial');
            topTextFrame += lineSpacing;
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Game Time', this.gameTime, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Score', this.arena.getScore(robotID), statRGB, true);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Banked', this.bankedWorth(robotID), statRGB, true);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Carrying', this.carriedWorth(robotID), statRGB, true);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Bulk', this.arena.robots[robotID].stats.bulk, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Action Time', this.arena.robots[robotID].stats.getActionTime(), statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'X Home', this.arena.robots[robotID].nest.x, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Y Home', this.arena.robots[robotID].nest.y, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'X Position', this.arena.robots[robotID].pos.x, statRGB, false);
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Y Position', this.arena.robots[robotID].pos.y, statRGB, false);
            // Display attributes
            topTextFrame += lineSpacing * 0.5;
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, 'Scan Range', this.arena.robots[robotID].stats.scanRange, statRGB, false);
            topTextFrame += lineSpacing * 0.5;
            for (var i = 0; i < this.arena.robots[robotID].stats.elements.length; i++) {
                let attack = this.arena.robots[robotID].stats.attack[i];
                let element = this.arena.robots[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Attack", attack, this.hpsColor[robotID].value(), false);
            }
            topTextFrame += lineSpacing * 0.5;
            for (var i = 0; i < this.arena.robots[robotID].stats.elements.length; i++) {
                let shield = this.arena.robots[robotID].stats.shield[i];
                let element = this.arena.robots[robotID].stats.elements[i];
                topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, element + " Shield", shield, this.hpsColor[robotID].value(), false);
            }
            topTextFrame = this.paper.showStatus(centerTextFrame, topTextFrame, "Armor", this.arena.robots[robotID].stats.armor, this.hpsColor[robotID].value(), false);
            // Print log.
            topTextFrame += lineSpacing * 2;
            this.paper.printLog(this.arena.robots[robotID], leftDisplayFrame + 40, topTextFrame);
            // Display scan view
            let leftMapFrame = leftDisplayFrame + attributeDisplayWidth;
            let topMapFrame = topDisplayFrame;
            // Cycle through all the tiles in the scan display box.
            for (var i = x0; i <= x1; i++) {
                for (var j = y0; j <= y1; j++) {
                    var tileScanID = -1;
                    var itemScanCount = 0;
                    var robotScanID = -1;
                    var tileAlpha = 0;
                    var robotAlpha = 0;
                    // Grab tile and robot IDs if the plotted region doesn't fall outside of the arena map.
                    if (i >= 0 && i < this.world.size.x && j >= 0 && j < this.world.size.y) {
                        tileScanID = this.scanData[robotID].tileMap[i][j];
                        itemScanCount = this.scanData[robotID].itemMap[i][j].length;
                        robotScanID = this.scanData[robotID].robotMap[i][j];
                        // Scan will fade as data ages.
                        let decayRate = 0.02;
                        let decayFloor = 0.3;
                        tileAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].scanTime[i][j]);
                        if (robotScanID >= 0) {
                            robotAlpha = this.decay(decayRate, decayFloor, this.gameTime - this.scanData[robotID].robots[robotScanID].lastScan);
                        }
                    }
                    // Draw tile.
                    if (tileScanID >= 0) {
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.world.tiles[tileScanID].sprite, new Vector(i - x0, j - y0), tileAlpha, false);
                    }
                    // Draw items.
                    if (itemScanCount > 0) {
                        this.paper.drawTile(leftMapFrame, topMapFrame, this.world.itemSprite, new Vector(i - x0, j - y0), tileAlpha, false);
                    }
                    // Draw robot.
                    if (robotScanID >= 0) {
                        this.paper.drawRobotDot(leftMapFrame + (i - x0 + 0.5) * spriteWidth, topMapFrame + (j - y0 + 0.5) * spriteWidth, spriteWidth * 0.5, this.colourOf(robotScanID), `${robotScanID + 1}`, robotAlpha);
                    }
                }
            }
            // Draw self in center of map.
            if (this.arena.robots[robotID].isAlive) {
                this.paper.drawRobotDot(leftMapFrame + (mapRadius + 0.5) * spriteWidth, topMapFrame + (mapRadius + 0.5) * spriteWidth, spriteWidth * 0.6, this.colourOf(robotID), `${robotID + 1}`);
            }
            else {
                topTextFrame = topMapFrame + 20;
                centerTextFrame = mapFrameSize / 2 + leftMapFrame;
                this.paper.drawListItem(centerTextFrame, topTextFrame, 'DESTROYED', red);
            }
            // Draw a frame around the map.
            this.paper.drawFrame(leftMapFrame, topMapFrame, mapFrameSize, mapFrameSize, this.colourOf(robotID));
            // Display permissive terrain under map.
            topTextFrame = topDisplayFrame + mapFrameSize + 20;
            centerTextFrame = mapFrameSize / 2 + leftMapFrame;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Passable Terrain', [120, 120, 120]);
            for (var i = 0; i < this.arena.robots[robotID].stats.permissiveTerrain.length; i++) {
                var color = [180, 180, 180];
                var text;
                topTextFrame += lineSpacing;
                text = this.arena.robots[robotID].stats.permissiveTerrain[i];
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display inventory under map.
            topTextFrame += lineSpacing * 1.5;
            this.paper.drawListItem(centerTextFrame, topTextFrame, 'Inventory', [120, 120, 120]);
            for (var i = 0; i < this.arena.robots[robotID].items.length; i++) {
                var color = [180, 180, 180];
                var text;
                if (this.arena.robots[robotID].items[i].isEquipped)
                    color = [51, 110, 156];
                topTextFrame += lineSpacing;
                text = this.arena.robots[robotID].items[i].name;
                this.paper.drawListItem(centerTextFrame, topTextFrame, text, color);
            }
            // Display items on ground under robot.
            let loc = this.arena.robots[robotID].pos;
            if (this.arena.itemMap[loc.x][loc.y].length > 0) {
                topTextFrame += lineSpacing * 2;
                this.paper.drawListItem(centerTextFrame, topTextFrame, 'On Ground', [120, 120, 120]);
                // Group items with the same name ("Armor ×3"), and show at most 6 lines.
                let counts = new Map();
                this.arena.itemMap[loc.x][loc.y].forEach(item => counts.set(item.name, (counts.get(item.name) || 0) + 1));
                let lines = [...counts].map(([name, count]) => count > 1 ? `${name} ×${count}` : name);
                if (lines.length > 6)
                    lines = lines.slice(0, 5).concat([`+${lines.length - 5} more`]);
                lines.forEach(text => {
                    topTextFrame += lineSpacing;
                    this.paper.drawListItem(centerTextFrame, topTextFrame, text, [180, 180, 180]);
                });
            }
        }
    }
    colourOf(robotID) {
        return Game.robotColours[robotID % Game.robotColours.length];
    }
    // Worth of the items lying on a robot's nest.
    bankedWorth(robotID) {
        let nest = this.arena.robots[robotID].nest;
        return this.arena.itemMap[nest.x][nest.y].reduce((sum, item) => sum + item.stats.worth, 0);
    }
    // Worth of the items a robot is carrying.
    carriedWorth(robotID) {
        return this.arena.robots[robotID].items.reduce((sum, item) => sum + item.stats.worth, 0);
    }
    addToFeed(text, rgb) {
        this.events_feed.push({ time: this.gameTime, text: text, rgb: rgb });
        if (this.events_feed.length > 12)
            this.events_feed.shift();
    }
    /**
     * The spectator view across the top of the screen: the whole map as it
     * really is, a scoreboard, and a feed of kills and respawns.
     */
    displaySpectator() {
        const left = 10, top = 34, tile = 16;
        const size = this.world.size;
        const robots = this.arena.robots;
        // (At the end, the game-over banner takes this spot.)
        if (this.gameTime > 0)
            this.paper.drawText(left, top - 8, `Time left: ${this.gameTime}`, [180, 180, 180], 'left', 'bold 13px Arial');
        // Tiles and items.
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                const tileID = this.arena.tileMap[x][y];
                if (this.world.tiles[tileID].name != 'Wall' || this.isNextToFloor(x, y)) {
                    this.paper.drawSprite(left + x * tile, top + y * tile, this.world.tiles[tileID].sprite, tile, 1);
                }
                const items = this.arena.itemMap[x][y];
                if (items.length > 0) {
                    this.paper.drawSprite(left + x * tile, top + y * tile, this.world.itemSprite, tile, 1);
                    if (items.length > 1)
                        this.paper.drawText(left + x * tile + tile, top + y * tile + tile, `${items.length}`, [255, 255, 255], 'right', 'bold 9px Arial');
                }
            }
        }
        // Nests, as squares in each robot's colour.
        robots.forEach((robot, i) => this.paper.drawSquare(left + robot.nest.x * tile, top + robot.nest.y * tile, tile, this.colourOf(i), 2));
        // Shots from the last 60 ticks, fading out. At high speed a frame can
        // cover many ticks, so every shot is also shown for at least 3 frames.
        const shotLife = 60;
        const shotAlpha = (shot) => Math.max(1 - (shot.time - this.gameTime) / shotLife, shot.drawn < 3 ? 0.7 : 0);
        this.shots = this.shots.filter(shot => shot.time - this.gameTime < shotLife || shot.drawn < 3);
        this.shots.forEach(shot => {
            this.paper.drawLine(left + (shot.from.x + 0.5) * tile, top + (shot.from.y + 0.5) * tile, left + (shot.to.x + 0.5) * tile, top + (shot.to.y + 0.5) * tile, shot.rgb, shotAlpha(shot), 2);
        });
        // Robots, as numbered dots.
        robots.forEach((robot, i) => {
            if (robot.isAlive)
                this.paper.drawRobotDot(left + (robot.pos.x + 0.5) * tile, top + (robot.pos.y + 0.5) * tile, tile * 0.5, this.colourOf(i), `${i + 1}`);
        });
        // Where each shot landed: a ring in the shooter's colour, larger for a hit.
        this.shots.forEach(shot => {
            this.paper.drawRing(left + (shot.to.x + 0.5) * tile, top + (shot.to.y + 0.5) * tile, shot.hit ? tile * 0.75 : tile * 0.4, shot.hit ? [255, 255, 255] : shot.rgb, shotAlpha(shot));
            shot.drawn++;
        });
        this.paper.drawFrame(left, top, size.x * tile, size.y * tile, [90, 90, 90]);
        // Scoreboard.
        const boardLeft = left + size.x * tile + 30;
        const columns = [['Robot', 0, 'left'], ['Score', 210, 'right'], ['Banked', 280, 'right'], ['Carrying', 360, 'right'], ['Kills', 420, 'right'], ['Deaths', 485, 'right'], ['Status', 510, 'left']];
        let row = top + 10;
        columns.forEach(([title, x, align]) => this.paper.drawText(boardLeft + x, row, title, [120, 120, 120], align, 'bold 13px Arial'));
        const order = robots.map((r, i) => i).sort((a, b) => this.arena.getScore(b) - this.arena.getScore(a));
        order.forEach(i => {
            const robot = robots[i];
            row += 26;
            const atNest = robot.isAlive && robot.pos.x == robot.nest.x && robot.pos.y == robot.nest.y;
            const status = !robot.isAlive ? `Destroyed (back in ${Math.max(0, this.gameTime - (robot.deathTime - this.world.respawnDelay))})`
                : this.isProtected(robot) ? `Protected (${this.gameTime - robot.protectedUntil})`
                    : atNest ? 'At its nest' : 'Out exploring';
            this.paper.drawRobotDot(boardLeft + 8, row - 5, 8, this.colourOf(i), `${i + 1}`);
            this.paper.drawText(boardLeft + 22, row, robot.name, this.colourOf(i), 'left', 'bold 14px Arial');
            const values = [this.arena.getScore(i), this.bankedWorth(i), this.carriedWorth(i), this.kills[i], this.deaths[i]];
            values.forEach((value, k) => this.paper.drawText(boardLeft + columns[k + 1][1], row, `${value}`, [220, 220, 220], 'right', '14px Arial'));
            this.paper.drawText(boardLeft + 510, row, this.world.respawnDelay > 0 || robot.isAlive ? status : 'Destroyed', robot.isAlive ? [180, 180, 180] : [235, 87, 87], 'left', '13px Arial');
        });
        this.paper.drawText(boardLeft, top + 150, 'Score = items on the nest, plus the robot\'s own worth while it is home.', [120, 120, 120], 'left', '11px Arial');
        // Score over time.
        this.drawScoreChart(boardLeft, top + 180, 680, size.y * tile - 185);
        // Feed of kills and respawns.
        const feedLeft = boardLeft + 720;
        this.paper.drawText(feedLeft, top + 10, 'Events (tick, newest first)', [120, 120, 120], 'left', 'bold 13px Arial');
        this.events_feed.slice().reverse().forEach((event, k) => {
            this.paper.drawText(feedLeft, top + 34 + k * 18, `${this.duration - event.time}  ${event.text}`, event.rgb, 'left', '13px Arial', k < 4 ? 1 : 0.6);
        });
    }
    // Samples every robot's score for the score chart.
    recordScores() {
        let elapsed = this.duration - this.gameTime;
        if (elapsed % this.scoreSampleTicks != 0)
            return;
        this.arena.robots.forEach((robot, i) => {
            if (!this.scoreHistory[i])
                this.scoreHistory[i] = [];
            this.scoreHistory[i].push(this.arena.getScore(i));
        });
    }
    // A line chart of each robot's score over the game so far.
    drawScoreChart(left, top, width, height) {
        const grey = [120, 120, 120];
        this.paper.drawText(left, top, 'Score over time', grey, 'left', 'bold 13px Arial');
        const chartTop = top + 10, chartBottom = top + height - 14;
        const samples = Math.max(2, Math.ceil(this.duration / this.scoreSampleTicks) + 1);
        const best = Math.max(10, ...this.scoreHistory.flat());
        const x = (k) => left + 30 + (width - 40) * k / (samples - 1);
        const y = (score) => chartBottom - (chartBottom - chartTop) * score / best;
        this.paper.drawLine(left + 30, chartBottom, left + width - 10, chartBottom, grey, 1, 1);
        this.paper.drawLine(left + 30, chartTop, left + 30, chartBottom, grey, 1, 1);
        this.paper.drawText(left + 26, chartTop + 8, `${best}`, grey, 'right', '10px Arial');
        this.paper.drawText(left + 26, chartBottom, '0', grey, 'right', '10px Arial');
        this.paper.drawText(left + 30, chartBottom + 12, 'start', grey, 'left', '10px Arial');
        this.paper.drawText(left + width - 10, chartBottom + 12, `tick ${this.duration}`, grey, 'right', '10px Arial');
        this.scoreHistory.forEach((history, i) => {
            for (let k = 1; k < history.length; k++) {
                this.paper.drawLine(x(k - 1), y(history[k - 1]), x(k), y(history[k]), this.colourOf(i), 1, 2);
            }
        });
    }
    // Walls are only drawn where they border open ground, so the map stays readable.
    isNextToFloor(x, y) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= this.world.size.x || ny >= this.world.size.y)
                    continue;
                if (this.world.tiles[this.arena.tileMap[nx][ny]].name != 'Wall')
                    return true;
            }
        }
        return false;
    }
    decay(decayRate, decayFloor, elapsedTime) {
        if (decayRate > 1)
            decayRate = 1;
        if (decayFloor > 1)
            decayFloor = 1;
        // f(x) = (1-f)(1 – r)^t
        return (1 - decayFloor) * Math.pow((1 - decayRate), elapsedTime) + decayFloor;
    }
    updateRobotPositions() {
        // Clear grid
        for (var i = 0; i < this.world.size.x; i++) {
            for (var j = 0; j < this.world.size.y; j++) {
                this.arena.robotMap[i][j] = -1;
            }
        }
        // Add live robots
        for (var i = 0; i < this.arena.robots.length; i++) {
            if (this.arena.robots[i].isAlive) {
                this.arena.robotMap[this.arena.robots[i].pos.x][this.arena.robots[i].pos.y] = i;
            }
        }
    }
    /**
     * Turns whatever a program returned into a safe action, or null. Programs
     * run in a sandbox, so their actions arrive as plain data and can't be trusted.
     */
    checkAction(robotID, raw) {
        if (!raw || typeof raw !== 'object' || typeof raw.command !== 'string')
            return null;
        let action = new Action();
        action.command = raw.command;
        action.item = typeof raw.item === 'string' ? raw.item : '';
        action.message = typeof raw.message === 'string' ? raw.message.slice(0, 200) : '';
        if (action.command == 'move' || action.command == 'attack') {
            if (!raw.target)
                return null;
            let x = Number(raw.target.x), y = Number(raw.target.y);
            if (!Number.isFinite(x) || !Number.isFinite(y))
                return null;
            // Bring very distant targets closer along the same line, so paths
            // stay short. Aiming past a target still works.
            let pos = this.arena.robots[robotID].pos;
            let limit = 2 * Math.max(this.world.size.x, this.world.size.y);
            let dx = x - pos.x, dy = y - pos.y;
            let reach = Math.max(Math.abs(dx), Math.abs(dy));
            if (reach > limit) {
                dx *= limit / reach;
                dy *= limit / reach;
            }
            action.target = new Vector(Math.round(pos.x + dx), Math.round(pos.y + dy));
        }
        return action;
    }
    // Every itemSpawnInterval ticks, place a new random item on the map.
    spawnItems() {
        let interval = this.world.itemSpawnInterval;
        let elapsed = this.duration - this.gameTime;
        if (interval > 0 && elapsed > 0 && elapsed % interval == 0)
            this.arena.spawnItem();
    }
    // Bring destroyed robots back respawnDelay ticks after they died, at their
    // nest (or the nearest free tile if another robot is on it). They come back
    // with a fresh, equipped starting kit that is worth 0 points, so destroying
    // a respawned robot can't be farmed for score, and they are briefly protected.
    respawnRobots() {
        if (this.world.respawnDelay <= 0)
            return;
        this.arena.robots.forEach((robot, i) => {
            if (robot.isAlive || this.gameTime > robot.deathTime - this.world.respawnDelay)
                return;
            let spot = this.freeTileNear(robot, robot.nest);
            if (!spot)
                return;
            robot.items = structuredClone(this.world.robots[0].items);
            robot.items.forEach(item => {
                item.stats.worth = 0;
                item.isEquipped = true;
            });
            robot.isAlive = true;
            robot.pos = spot;
            robot.protectedUntil = this.gameTime - this.world.respawnProtection;
            this.arena.robotMap[robot.pos.x][robot.pos.y] = i;
            this.equipItems(robot);
            this.appendToLog(robot, this.gameTime, spot.isEqualTo(robot.nest) ? 'Respawns at its nest' : 'Respawns next to its occupied nest');
            this.addToFeed(`${robot.name} respawned`, this.colourOf(i));
        });
    }
    // Equipped armor slowly repairs while its robot stands on its nest.
    repairAtNests() {
        let interval = this.world.nestRepairInterval;
        if (interval <= 0 || (this.duration - this.gameTime) % interval != 0)
            return;
        this.arena.robots.forEach(robot => {
            if (!robot.isAlive || robot.pos.x != robot.nest.x || robot.pos.y != robot.nest.y)
                return;
            let repaired = false;
            robot.items.forEach(item => {
                if (!item.isEquipped)
                    return;
                let original = this.world.items.find(d => d.name === item.name);
                if (!original)
                    return;
                if (item.stats.armor < original.stats.armor) {
                    item.stats.armor++;
                    repaired = true;
                }
            });
            if (repaired)
                this.equipItems(robot);
        });
    }
    // The nearest tile to `place` (by walking distance) that the robot can stand
    // on and that no other robot is on, or null if there isn't one.
    freeTileNear(robot, place) {
        let distance = this.arena.walkingDistances(place);
        let best = null;
        for (let x = 0; x < this.world.size.x; x++) {
            for (let y = 0; y < this.world.size.y; y++) {
                if (distance[x][y] == Infinity || this.arena.robotMap[x][y] >= 0)
                    continue;
                if (!robot.stats.permissiveTerrain.includes(this.world.tiles[this.arena.tileMap[x][y]].name))
                    continue;
                if (!best || distance[x][y] < distance[best.x][best.y])
                    best = new Vector(x, y);
            }
        }
        return best;
    }
    isProtected(robot) {
        return robot.isAlive && this.gameTime > robot.protectedUntil;
    }
    // Stops every robot's program.
    stop() {
        this.programs.forEach(program => program.stop());
    }
    requestAttack(robotID, action) {
        let delay = this.arena.robots[robotID].stats.getActionTime();
        this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
    }
    resolveAttack(action) {
        // Map path to target.
        let path = this.arena.robots[action.robotID].pos.getPathTo(action.action.target);
        let targetID = -1;
        let shotEnd = this.arena.robots[action.robotID].pos;
        // Follow path until it hits something.
        for (var i = 0; i < path.length; i++) {
            // Stop at the edge of the map.
            if (path[i].x < 0 || path[i].x >= this.world.size.x || path[i].y < 0 || path[i].y >= this.world.size.y)
                break;
            shotEnd = path[i];
            let tileID = this.arena.tileMap[path[i].x][path[i].y];
            let robotID = this.arena.robotMap[path[i].x][path[i].y];
            // Hit the first robot in the path (other than the attacker). This is
            // checked before the tile, so a robot standing in a doorway can be hit.
            if (robotID >= 0 && robotID != action.robotID) {
                targetID = robotID;
                break;
            }
            // Otherwise stop if the tile blocks the shot.
            if (!this.world.tiles[tileID].transparent)
                break;
        }
        // Remember the shot so the spectator view can draw it.
        this.shots.push({
            from: new Vector(this.arena.robots[action.robotID].pos.x, this.arena.robots[action.robotID].pos.y),
            to: new Vector(shotEnd.x, shotEnd.y),
            time: this.gameTime,
            rgb: this.colourOf(action.robotID),
            hit: targetID >= 0,
            drawn: 0,
        });
        // A shot that hits nobody is logged as a miss.
        if (targetID == -1) {
            this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Misses its shot at ${new Vector(action.action.target.x, action.action.target.y).print()}`);
            this.setActionResult(action.robotID, 'attack', 'missed');
        }
        // Inflict damage on robot if there is one in path.
        // Attacking ends the attacker's own spawn protection.
        this.arena.robots[action.robotID].protectedUntil = Infinity;
        // A robot that has just respawned can't be damaged.
        if (targetID >= 0 && this.isProtected(this.arena.robots[targetID])) {
            let attacker = this.arena.robots[action.robotID];
            let defender = this.arena.robots[targetID];
            this.appendToLog(attacker, this.gameTime, `attacks ${defender.name}, but it is protected`);
            this.appendToLog(defender, this.gameTime, `Shot by ${attacker.name} while protected`);
            this.setActionResult(action.robotID, 'attack', 'target is protected');
            defender.lastHit = {
                attackerID: action.robotID,
                attackerName: attacker.name,
                from: new Vector(attacker.pos.x, attacker.pos.y),
                time: this.gameTime,
                damage: [0, 0, 0],
            };
            targetID = -2;
        }
        if (targetID >= 0) {
            let attacker = this.arena.robots[action.robotID];
            let defender = this.arena.robots[targetID];
            // Shields block part of each element's attack, but never more
            // than maxShieldBlock of it, so every hit does some damage.
            let damage = [];
            for (let i = 0; i < defender.stats.elements.length; i++) {
                let attack = attacker.stats.attack[i];
                let blocked = Math.min(defender.stats.shield[i], Math.ceil(attack * this.world.maxShieldBlock));
                damage.push(Math.max(0, attack - blocked));
            }
            let total = damage.reduce((a, b) => a + b, 0);
            // Both robots learn about the hit. The defender also learns who
            // fired and from where, even if it can't see the attacker.
            this.appendToLog(attacker, this.gameTime, `attacks ${defender.name} for ${total} damage`);
            this.setActionResult(action.robotID, 'attack');
            this.appendToLog(defender, this.gameTime, `Hit by ${attacker.name} for ${total} damage`);
            defender.lastHit = {
                attackerID: action.robotID,
                attackerName: attacker.name,
                from: new Vector(attacker.pos.x, attacker.pos.y),
                time: this.gameTime,
                damage: damage.slice(),
            };
            // Equipped armor absorbs the damage of every element from one
            // shared pool, and wears down as it does.
            let remaining = total;
            for (let i = 0; i < defender.items.length && remaining > 0; i++) {
                let item = defender.items[i];
                if (!item.isEquipped)
                    continue;
                let absorbed = Math.min(remaining, item.stats.armor);
                item.stats.armor -= absorbed;
                remaining -= absorbed;
            }
            // ElectroMagnetic damage also slows the target's current action,
            // but only once per action, so a robot can't be stun-locked. An
            // equipped EM Shield prevents the slow altogether.
            let emDamage = damage[2];
            if (emDamage > 0 && this.world.emSlowPerDamage > 0 && defender.stats.shield[2] == 0) {
                let pending = this.events.find(e => e.robotID == targetID);
                if (pending && !pending.slowed) {
                    pending.duration -= emDamage * this.world.emSlowPerDamage;
                    pending.slowed = true;
                }
            }
            // Recompute the defender's stats from its worn-down items.
            this.equipItems(defender);
            // Any damage the armor couldn't absorb kills the robot.
            if (remaining > 0) {
                defender.isAlive = false;
                defender.deathTime = this.gameTime;
                // Drop items and clear the robot from the map.
                while (defender.items.length > 0)
                    this.dropItem(defender, 0);
                this.arena.robotMap[defender.pos.x][defender.pos.y] = -1;
                // Cancel any actions it still had queued.
                this.events = this.events.filter(e => e.robotID != targetID);
                // Write to event log.
                this.appendToLog(defender, this.gameTime, `dies :( destroyed by ${attacker.name}`);
                this.appendToLog(attacker, this.gameTime, `Destroys ${defender.name}`);
                this.kills[action.robotID]++;
                this.deaths[targetID]++;
                this.addToFeed(`${attacker.name} destroyed ${defender.name}`, this.colourOf(action.robotID));
            }
        }
    }
    requestMove(robotID, action) {
        let destination = this.arena.robots[robotID].pos.getPathTo(action.target)[0];
        let delay = this.arena.robots[robotID].stats.getActionTime();
        delay *= this.arena.robots[robotID].pos.getDistanceTo(destination);
        // Add action to event que.
        this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        // Animate display elements
        this.coreColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
    }
    resolveMove(action) {
        var destination = this.arena.robots[action.robotID].pos.getPathTo(action.action.target)[0];
        var tileID = this.arena.tileMap[destination.x][destination.y];
        var tileName = this.world.tiles[tileID].name;
        let permissiveTerrainIndex = this.arena.robots[action.robotID].stats.permissiveTerrain.findLastIndex(d => d === tileName);
        // Is another robot already standing there?
        let occupantID = this.arena.robotMap[destination.x][destination.y];
        let isOccupied = occupantID >= 0 && occupantID != action.robotID;
        // Two robots stepping into each other's tiles swap places, so robots
        // meeting head-on in a corridor can't block each other forever.
        if (isOccupied && permissiveTerrainIndex >= 0) {
            let mover = this.arena.robots[action.robotID];
            let other = this.arena.robots[occupantID];
            let otherMove = this.events.find(e => e.robotID == occupantID && e.action.command == 'move');
            if (otherMove) {
                let otherStep = other.pos.getPathTo(otherMove.action.target)[0];
                if (otherStep.isEqualTo(mover.pos)) {
                    let moverFrom = mover.pos;
                    mover.pos = destination;
                    other.pos = moverFrom;
                    this.arena.robotMap[mover.pos.x][mover.pos.y] = action.robotID;
                    this.arena.robotMap[other.pos.x][other.pos.y] = occupantID;
                    // The other robot's move is done too.
                    this.events = this.events.filter(e => e !== otherMove);
                    this.appendToLog(mover, this.gameTime, `Swaps places with ${other.name}`);
                    this.appendToLog(other, this.gameTime, `Swaps places with ${mover.name}`);
                    this.setActionResult(action.robotID, 'move');
                    this.setActionResult(occupantID, 'move');
                    this.coreColor[action.robotID].deactivate();
                    this.batteryColor[action.robotID].deactivate();
                    this.powerColor[action.robotID].deactivate();
                    return;
                }
            }
        }
        // Can the robot move into this tile?
        if (permissiveTerrainIndex >= 0 && !isOccupied) {
            // Change position in arena.
            this.arena.robotMap[this.arena.robots[action.robotID].pos.x][this.arena.robots[action.robotID].pos.y] = -1;
            this.arena.robotMap[destination.x][destination.y] = action.robotID;
            // Change position in stats.
            this.arena.robots[action.robotID].pos = destination;
            // Write to event log
            this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Moves to ${destination.print()}`);
            this.setActionResult(action.robotID, 'move');
        }
        else {
            // Take damage if you run into something.
            // Write to event log.
            if (isOccupied) {
                this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Bumps into ${this.arena.robots[occupantID].name}`);
                this.setActionResult(action.robotID, 'move', `blocked by ${this.arena.robots[occupantID].name}`);
            }
            else {
                this.appendToLog(this.arena.robots[action.robotID], this.gameTime, `Collides with obstacle`);
                this.setActionResult(action.robotID, 'move', `blocked by ${tileName}`);
            }
            // this.takeDamage(this.arena.robots[action.robotID], 10);
            this.hpsColor[action.robotID].pulse();
            this.chassisColor[action.robotID].pulse();
        }
        // Animate display elements.
        this.coreColor[action.robotID].deactivate();
        this.batteryColor[action.robotID].deactivate();
        this.powerColor[action.robotID].deactivate();
    }
    // Finds the item a command refers to. With several items of the same name,
    // prefer one in the right state: an unequipped one to equip, an equipped one
    // to unequip, and an unequipped one to drop.
    findItem(items, name, prefer) {
        let wanted = items.findLastIndex(d => d.name === name && d.isEquipped == (prefer == 'equipped'));
        return wanted >= 0 ? wanted : items.findLastIndex(d => d.name === name);
    }
    requestEquip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.findItem(this.arena.robots[robotID].items, action.item, 'unequipped');
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
        else {
            this.setActionResult(robotID, 'equip', `has no ${action.item}`);
        }
    }
    resolveEquip(event) {
        // Move item to the top of the list and set to active.
        let itemID = this.findItem(this.arena.robots[event.robotID].items, event.action.item, 'unequipped');
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items.unshift(this.arena.robots[event.robotID].items.splice(itemID, 1)[0]);
            this.arena.robots[event.robotID].items[0].isEquipped = true;
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Equips its ${event.action.item}`);
            this.setActionResult(event.robotID, 'equip');
        }
        else {
            this.setActionResult(event.robotID, 'equip', `has no ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestUnequip(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.findItem(this.arena.robots[robotID].items, action.item, 'equipped');
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
        else {
            this.setActionResult(robotID, 'unequip', `has no ${action.item}`);
        }
    }
    resolveUnequip(event) {
        // Move item to the bottom of the list and set to inactive.
        let itemID = this.findItem(this.arena.robots[event.robotID].items, event.action.item, 'equipped');
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items[itemID].isEquipped = false;
            this.arena.robots[event.robotID].items.push(this.arena.robots[event.robotID].items.splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Unequips its ${event.action.item}`);
            this.setActionResult(event.robotID, 'unequip');
        }
        else {
            this.setActionResult(event.robotID, 'unequip', `has no ${event.action.item}`);
        }
        // Equip items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestDrop(robotID, action) {
        // Does item exist in inventory?
        let itemID = this.findItem(this.arena.robots[robotID].items, action.item, 'unequipped');
        if (itemID >= 0) {
            let delay = this.arena.robots[robotID].stats.getActionTime();
            // Add action to event que.
            this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
        }
        else {
            this.setActionResult(robotID, 'drop', `has no ${action.item}`);
        }
    }
    resolveDrop(event) {
        let robot = this.arena.robots[event.robotID];
        let itemID = this.findItem(robot.items, event.action.item, 'unequipped');
        if (itemID >= 0) {
            this.dropItem(robot, itemID);
            this.setActionResult(event.robotID, 'drop');
        }
        else {
            this.setActionResult(event.robotID, 'drop', `has no ${event.action.item}`);
        }
    }
    requestTake(robotID, action) {
        // Does the robot have enough room in its inventory?
        if (this.arena.robots[robotID].stats.maxCarry > this.arena.robots[robotID].items.length) {
            // Does item exist in tile?
            let location = this.arena.robots[robotID].pos;
            let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === action.item);
            if (itemID >= 0) {
                let delay = this.arena.robots[robotID].stats.getActionTime();
                // Add action to event que.
                this.events.push(new GameEvent(robotID, action, this.gameTime - delay));
            }
            else {
                this.setActionResult(robotID, 'take', `no ${action.item} here`);
            }
        }
        else {
            this.setActionResult(robotID, 'take', 'inventory full');
        }
    }
    resolveTake(event) {
        // Move item to inventory.
        let location = this.arena.robots[event.robotID].pos;
        let itemID = this.arena.itemMap[location.x][location.y].findLastIndex(d => d.name === event.action.item);
        if (itemID >= 0) {
            this.arena.robots[event.robotID].items.push(this.arena.itemMap[location.x][location.y].splice(itemID, 1)[0]);
            // Write to event log.
            this.appendToLog(this.arena.robots[event.robotID], this.gameTime, `Takes the ${event.action.item}`);
            this.setActionResult(event.robotID, 'take');
        }
        else {
            this.setActionResult(event.robotID, 'take', `no ${event.action.item} here`);
        }
        // Equip items and apply mods.
        this.equipItems(this.arena.robots[event.robotID]);
    }
    requestScan(robotID, call) {
        // Set scan range and delay.
        call.range = this.arena.robots[robotID].stats.scanRange;
        let delay = this.arena.robots[robotID].stats.getActionTime();
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, this.gameTime - delay));
        // Animate display elements.
        this.scannerColor[robotID].activate();
        this.batteryColor[robotID].activate();
        this.powerColor[robotID].activate();
    }
    resolveScan(event) {
        // Set rane and perform scan.        
        let range = this.arena.robots[event.robotID].stats.scanRange;
        this.scanData[event.robotID] = this.arena.scan(this.arena.robots[event.robotID].pos, range, this.scanData[event.robotID], this.gameTime);
        // Write to event log.
        this.appendToLog(this.arena.robots[event.robotID], this.gameTime, "Scans the area");
        this.setActionResult(event.robotID, 'scan');
        // Animate display elements.
        this.scannerColor[event.robotID].deactivate();
        this.batteryColor[event.robotID].deactivate();
        this.powerColor[event.robotID].deactivate();
    }
    requestSay(robotID, call) {
        // Add action to event queue.
        this.events.push(new GameEvent(robotID, call, this.gameTime));
    }
    resolveSay(event) {
        // Write to event log.
        this.appendToLog(this.arena.robots[event.robotID], this.gameTime, 'Says: ' + event.action.message);
        this.setActionResult(event.robotID, 'say');
    }
    equipItems(robot) {
        // Unequip any items over the max.
        for (var i = robot.stats.maxEquip; i < robot.items.length; i++) {
            robot.items[i].isEquipped = false;
        }
        // Recompute attributes based on equipped items.
        robot.stats.copy(robot.baseStats);
        for (var i = 0; i < robot.items.length; i++) {
            if (robot.items[i].isEquipped) {
                robot.stats.add(robot.items[i].stats);
            }
            else {
                // Carried items still count toward worth and bulk.
                robot.stats.worth += robot.items[i].stats.worth;
                robot.stats.bulk += robot.items[i].stats.bulk;
            }
        }
    }
    dropItem(robot, itemID) {
        if (robot.items.length > itemID) {
            let location = robot.pos;
            this.appendToLog(robot, this.gameTime, `drops its ${robot.items[itemID].name}`);
            robot.items[itemID].isEquipped = false;
            this.arena.itemMap[location.x][location.y].push(robot.items.splice(itemID, 1)[0]);
            this.equipItems(robot);
        }
    }
    appendToLog(robot, time, entry) {
        // The on-screen log: the same entry repeated in a row is shown once with a count.
        let last = robot.logEntry.length - 1;
        if (last >= 0 && robot.logEntry[last] == entry) {
            robot.logRepeat[last]++;
            robot.logTime[last] = time;
        }
        else {
            robot.logTime.push(time);
            robot.logEntry.push(entry);
            robot.logRepeat.push(1);
            if (robot.logTime.length > robot.maxLogLength) {
                robot.logTime.shift();
                robot.logEntry.shift();
                robot.logRepeat.shift();
            }
        }
        // The full log, for downloading.
        let log = this.fullLogs[robot.robotID];
        if (!log)
            log = this.fullLogs[robot.robotID] = [];
        let previous = log[log.length - 1];
        if (previous && previous.entry == entry) {
            previous.end = time;
            previous.count++;
        }
        else {
            log.push({ start: time, end: time, entry: entry, count: 1 });
        }
    }
    // Records how the robot's last action turned out, for its program to read.
    setActionResult(robotID, command, failure = '') {
        this.arena.robots[robotID].lastAction = {
            command: command,
            status: failure ? 'failed' : 'done',
            reason: failure,
            time: this.gameTime,
        };
    }
    // All robots' full logs as plain text.
    fullLogText() {
        let lines = [];
        this.arena.robots.forEach((robot, i) => {
            lines.push(`=== ${robot.name} ===`);
            (this.fullLogs[i] || []).forEach(line => {
                let when = line.count > 1 ? `${line.start}-${line.end}` : `${line.start}`;
                let repeat = line.count > 1 ? ` (x${line.count})` : '';
                lines.push(`${when}\t${line.entry}${repeat}`);
            });
            lines.push('');
        });
        return lines.join('\n');
    }
}

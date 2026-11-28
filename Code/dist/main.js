"use strict";
// The page has four screens: the home page, the shop (where robots are loaded,
// reviewed and saved as cards), the arena (where they battle) and How to play
// (the README). The address bar's #home, #shop, #arena or #help picks the screen.
// The game being played, and a counter that changes whenever a game starts
// or stops, so an old game loop knows to quit.
var currentGame = null;
var lastGame = null; // kept after stopping, for downloading its logs
var gameRunID = 0;
var gameTimer = 0;
// The robots in the last battle started from the shop, for "Restart battle".
var battleRobots = [];
// Playback controls: ticks played per frame, and whether the game is paused.
var gameSpeed = 1;
var isPaused = false;
// ---------------------------------------------------------------------------
// Screens.
// ---------------------------------------------------------------------------
function showScreen() {
    let screen = (location.hash || '#home').slice(1);
    if (screen === 'pit')
        screen = 'shop'; // the shop used to be called the pit
    const name = ['home', 'shop', 'arena', 'help'].includes(screen) ? screen : 'home';
    // (Sections are named "screen-..." so the browser doesn't also scroll to them.)
    document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
    document.querySelectorAll('nav a[data-screen]').forEach(a => a.classList.toggle('active', a.dataset.screen === name));
    // Leaving the arena ends the battle, so it doesn't keep running unseen.
    if (name !== 'arena')
        stopGame();
    const empty = document.getElementById('arena-empty');
    if (empty)
        empty.hidden = !(name === 'arena' && battleRobots.length === 0 && !lastGame);
    if (name === 'help')
        Help.load();
    window.scrollTo(0, 0);
}
function startBattle() {
    Shop.applyPendingEdits(); // battle with the code the shop shows
    battleRobots = Shop.robots();
    if (battleRobots.length === 0)
        return;
    if (location.hash !== '#arena')
        location.hash = '#arena'; // shows the arena (and stops any old game)
    runGame();
}
// ---------------------------------------------------------------------------
// Running a battle.
// ---------------------------------------------------------------------------
async function runGame() {
    // End any game that is already running.
    stopGame();
    const runID = gameRunID;
    const empty = document.getElementById('arena-empty');
    if (battleRobots.length === 0) {
        if (empty)
            empty.hidden = false;
        return;
    }
    if (empty)
        empty.hidden = true;
    const bench = document.getElementById('bench');
    if (bench)
        bench.hidden = true;
    const game = new Game(new GaiaData(), 10000);
    // Load each robot's program into its own sandbox. Skip a robot whose code
    // has an error or doesn't end with `new MyProgram();`.
    for (const robot of battleRobots) {
        let bot;
        try {
            bot = await SandboxedBot.load(robot.code);
        }
        catch (error) {
            alert(`${robot.name} wasn't added to the battle because ${error instanceof Error ? error.message : error}`);
            continue;
        }
        // Stop if the battle was restarted or stopped while programs were loading.
        if (runID != gameRunID) {
            bot.stop();
            game.stop();
            return;
        }
        game.addRobot(bot, robot.name, true);
    }
    // Stop if the battle was restarted or stopped while the last program was
    // loading, or if no robot could be loaded at all.
    if (runID != gameRunID || game.programs.length === 0) {
        game.stop();
        if (runID == gameRunID && empty)
            empty.hidden = false;
        return;
    }
    currentGame = game;
    lastGame = game;
    // Game loop: every 10 ms, play gameSpeed ticks and draw the last one.
    const step = async () => {
        if (runID != gameRunID)
            return;
        if (isPaused) {
            gameTimer = setTimeout(step, 50);
            return;
        }
        for (let tick = 0; tick < gameSpeed && game.gameTime > 0; tick++) {
            await game.run(tick == gameSpeed - 1);
            if (runID != gameRunID)
                return;
        }
        if (game.gameTime > 0) {
            gameTimer = setTimeout(step, 10);
        }
        else {
            // Game over: the final screen stays up and the programs are stopped.
            game.stop();
        }
    };
    step();
}
// ---------------------------------------------------------------------------
// The test bench: one battle is mostly luck (the map, where the nests are),
// so this plays several full battles on new maps without drawing them, and
// shows how each robot did over all of them.
// ---------------------------------------------------------------------------
// The test bench controls: how many battles, and whether to use the same maps
// every time (so two versions of a robot can be compared on identical maps).
function runBenchFromControls() {
    const count = parseInt(document.getElementById('bench-count').value) || 10;
    const sameMaps = document.getElementById('bench-same').checked;
    return runBench(count, sameMaps);
}
async function runBench(count = 10, sameMaps = false) {
    Shop.applyPendingEdits();
    const robots = Shop.robots();
    if (robots.length === 0) {
        location.hash = '#shop';
        return;
    }
    battleRobots = robots;
    if (location.hash !== '#arena')
        location.hash = '#arena';
    stopGame();
    const runID = gameRunID;
    const panel = document.getElementById('bench');
    const empty = document.getElementById('arena-empty');
    if (empty)
        empty.hidden = true;
    panel.hidden = false;
    const tally = new Map(robots.map(r => [r.name, { wins: 0, scores: [], kills: 0, deaths: 0, errors: 0 }]));
    const problems = new Set();
    const show = (heading) => {
        const rows = [...tally.entries()].sort((a, b) => avg(b[1].scores) - avg(a[1].scores)).map(([name, t]) => `<tr><td>${escapeHtml(name)}</td><td>${fmt(t.wins)}</td><td>${t.scores.length ? Math.round(avg(t.scores)) + (t.scores.length > 1 ? ' ± ' + Math.round(stdErr(t.scores)) : '') : '–'}</td>` +
            `<td>${t.scores.length ? Math.min(...t.scores) + '–' + Math.max(...t.scores) : '–'}</td><td>${t.kills}</td><td>${t.deaths}</td>` +
            `<td class="${t.errors ? 'bad' : ''}">${t.errors}</td></tr>`).join('');
        panel.innerHTML = `<h3>${heading}</h3>
            <table><thead><tr><th>Robot</th><th>Wins</th><th>Average score</th><th>Range</th><th>Kills</th><th>Deaths</th><th>Program errors</th></tr></thead><tbody>${rows}</tbody></table>
            ${[...problems].map(p => `<p class="message">${escapeHtml(p)}</p>`).join('')}
            <p class="hint">${sameMaps ? `The same ${count} maps are used every time you tick "Same maps", so you can compare two versions of a robot fairly.` : 'Each battle is on a new random map.'}
            Scores swing a lot from map to map: the ± is the uncertainty of the average (one standard error), so a difference smaller than about twice that may just be luck. The map below shows the last battle.</p>`;
    };
    for (let n = 1; n <= count; n++) {
        show(`Test bench: battle ${n} of ${count}…`);
        if (sameMaps)
            rng.setSeed(1000 + n); // battle n always gets the same map
        const game = new Game(new GaiaData(), 10000);
        for (const robot of robots) {
            try {
                game.addRobot(await SandboxedBot.load(robot.code), robot.name, true);
            }
            catch (error) {
                problems.add(`${robot.name} couldn't battle because ${error instanceof Error ? error.message : error}`);
            }
            if (runID != gameRunID) {
                game.stop();
                return;
            }
        }
        if (game.programs.length === 0)
            break;
        lastGame = game;
        let ticks = 0;
        while (game.gameTime > 0) {
            await game.run(false);
            if (++ticks % 250 === 0)
                await new Promise(r => setTimeout(r, 0)); // keep the page responsive
            if (runID != gameRunID) {
                game.stop();
                return;
            }
        }
        game.stop();
        const scores = game.arena.robots.map((r, i) => game.arena.getScore(i));
        const best = Math.max(...scores);
        const winners = scores.filter(s => s === best).length;
        game.arena.robots.forEach((r, i) => {
            const t = tally.get(r.name);
            if (!t)
                return;
            t.scores.push(scores[i]);
            t.kills += game.kills[i];
            t.deaths += game.deaths[i];
            t.errors += (game.fullLogs[i] || []).filter(line => line.entry.startsWith('Program error')).reduce((sum, line) => sum + line.count, 0);
            if (scores[i] === best)
                t.wins += 1 / winners;
        });
    }
    if (sameMaps)
        rng.setSeed(Date.now()); // back to new maps for normal battles
    show(`Test bench: ${count} battles${sameMaps ? ' on the same maps' : ''}`);
}
const avg = (values) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : -1;
const stdErr = (values) => {
    const m = avg(values);
    return Math.sqrt(values.reduce((s, v) => s + (v - m) * (v - m), 0) / (values.length - 1) / values.length);
};
const fmt = (n) => Number.isInteger(n) ? `${n}` : n.toFixed(1);
const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function togglePause() {
    isPaused = !isPaused;
    const button = document.getElementById('pause');
    if (button)
        button.textContent = isPaused ? 'Resume' : 'Pause';
}
function setSpeed(speed) {
    gameSpeed = Math.max(1, parseInt(speed) || 1);
}
// Saves every robot's full log from the current or last game as a text file.
function downloadLogs() {
    if (!lastGame) {
        alert('Run a battle first, then download its logs.');
        return;
    }
    const text = `Advolition game logs (times are ticks since the start of the game, out of ${lastGame.duration})\n\n` + lastGame.fullLogText();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    link.download = 'advolition-logs.txt';
    link.click();
    URL.revokeObjectURL(link.href);
}
function stopGame() {
    gameRunID++;
    clearTimeout(gameTimer);
    if (currentGame) {
        currentGame.stop();
        currentGame = null;
    }
}
// ---------------------------------------------------------------------------
// Start-up.
// ---------------------------------------------------------------------------
window.addEventListener('hashchange', showScreen);
window.addEventListener('DOMContentLoaded', () => {
    Shop.init();
    showScreen();
});

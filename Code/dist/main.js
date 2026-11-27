"use strict";
// The page has three screens: the home page, the pit (where robots are loaded,
// reviewed and saved as cards) and the arena (where they battle). The address
// bar's #home, #pit or #arena picks the screen.
// The game being played, and a counter that changes whenever a game starts
// or stops, so an old game loop knows to quit.
var currentGame = null;
var lastGame = null; // kept after stopping, for downloading its logs
var gameRunID = 0;
var gameTimer = 0;
// The robots in the last battle started from the pit, for "Restart battle".
var battleRobots = [];
// Playback controls: ticks played per frame, and whether the game is paused.
var gameSpeed = 1;
var isPaused = false;
// ---------------------------------------------------------------------------
// Screens.
// ---------------------------------------------------------------------------
function showScreen() {
    const screen = (location.hash || '#home').slice(1);
    const name = ['home', 'pit', 'arena'].includes(screen) ? screen : 'home';
    // (Sections are named "screen-..." so the browser doesn't also scroll to them.)
    document.querySelectorAll('.screen').forEach(s => s.hidden = s.id !== 'screen-' + name);
    document.querySelectorAll('nav a[data-screen]').forEach(a => a.classList.toggle('active', a.dataset.screen === name));
    // Leaving the arena ends the battle, so it doesn't keep running unseen.
    if (name !== 'arena')
        stopGame();
    const empty = document.getElementById('arena-empty');
    if (empty)
        empty.hidden = !(name === 'arena' && battleRobots.length === 0 && !lastGame);
    window.scrollTo(0, 0);
}
function startBattle() {
    battleRobots = Pit.robots();
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
    Pit.init();
    showScreen();
});

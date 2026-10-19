"use strict";
var robotCount = 4;
var robotCodes = [];
for (var i = 0; i < robotCount; i++)
    robotCodes.push('Empty');
// The game being played, and a counter that changes whenever a game starts
// or stops, so an old game loop knows to quit.
var currentGame = null;
var lastGame = null; // kept after stopping, for downloading its logs
var gameRunID = 0;
var gameTimer = 0;
// Playback controls: ticks played per frame, and whether the game is paused.
var gameSpeed = 1;
var isPaused = false;
function loadFile(robotNumber, fileSelector) {
    // Read from the file input that triggered this call.
    const file = fileSelector.files;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        robotCodes[robotNumber] = reader.result;
    }, false);
    if (file && file.length > 0) {
        reader.readAsText(file[0]);
    }
}
async function runGame() {
    // End any game that is already running.
    stopGame();
    const runID = gameRunID;
    const game = new Game(new GaiaData(), 10000);
    // Load each robot's program into its own sandbox. Skip a robot whose file
    // has an error or doesn't end with `new MyProgram();`.
    for (var i = 0; i < robotCodes.length; i++) {
        if (robotCodes[i] != 'Empty') {
            let bot;
            try {
                bot = await SandboxedBot.load(robotCodes[i]);
            }
            catch (error) {
                alert(`Robot ${i + 1} wasn't added because ${error instanceof Error ? error.message : error}`);
                continue;
            }
            // Stop if Run or Stop was pressed while programs were loading.
            if (runID != gameRunID) {
                bot.stop();
                game.stop();
                return;
            }
            game.addRobot(bot, `Robot ${i + 1}`, true);
        }
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
        alert('Run a game first, then download its logs.');
        return;
    }
    const text = `Advolition game logs (gameTime counts down from ${lastGame.duration})\n\n` + lastGame.fullLogText();
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

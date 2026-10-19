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
    // Game loop: play one turn, then wait 10 ms before the next.
    const step = async () => {
        if (runID != gameRunID)
            return;
        await game.run();
        if (runID != gameRunID)
            return;
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

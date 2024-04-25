"use strict";
var intervalID = 0;
var robotCount = 4;
var robotCodes = [];
for (var i = 0; i < robotCount; i++)
    robotCodes.push('Empty');
function loadFile(robotNumber) {
    const fileSelector = document.querySelector("input[type=file]");
    const [file] = [fileSelector.files];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        robotCodes[robotNumber] = reader.result;
    }, false);
    if (file) {
        reader.readAsText(file[0]);
    }
}
function runGame() {
    const game = new Game(new GaiaData(), 10000);
    // Stop the interval if a program is already running.
    if (intervalID > 0)
        clearInterval(intervalID);
    // Link to the HTML text area that contains the robot code.
    const robotCode = document.querySelector(".robotCode");
    // Evaluate the robotCodes to create a new program object.
    for (var i = 0; i < robotCodes.length; i++) {
        if (robotCodes[i] != 'Empty') {
            game.addRobot(eval(robotCodes[0]), `Robot ${i + 1}`, true);
        }
        else {
            game.addRobot(new Target(), `Robot ${i + 1}`, false);
        }
    }
    // Game animation loop. The interval sets that animation frame rate in ms.
    intervalID = setInterval(() => game.run(), 10);
}
function stopGame() {
    // Stop the interval if a program is already running.
    if (intervalID > 0)
        clearInterval(intervalID);
}

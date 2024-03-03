"use strict";
var intervalID = 0;
/**
 * This function is called from from the HTML button to start the game
 * after the robot code has been loaded into the HTML text area.
 */
function runGame() {
    // Stop the interval if a program is already running.
    if (intervalID > 0)
        clearInterval(intervalID);
    // Link to the HTML text area that contains the robot code.
    const input = document.getElementById("myTextarea");
    // Import the text area content into a string.
    if (input) {
        const inputValue = input.value;
    }
    // Evaluate the string to create a new program object.
    var test = eval(input.value);
    const game = new Game(new GaiaData());
    // Load robots, inlcuding the program object that was created from the HTML text area.
    game.addRobot(new Tobor(), "Alpha");
    game.addRobot(test, "Target");
    // game.addRobot(new Tobor(), "Delta");
    // game.addRobot(new Tobor(), "Gamma");
    // Game animation loop. The interval sets that animation frame rate in ms.
    intervalID = setInterval(() => game.run(), 100);
}
/**
 * This function is invoked by the HTML stop botton to stop the game.
 */
function stopGame() {
    // Stop the interval if a program is already running.
    if (intervalID > 0)
        clearInterval(intervalID);
}

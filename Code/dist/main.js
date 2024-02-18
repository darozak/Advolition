"use strict";
// const game = new Game(gaia);
const game = new Game(new GaiaData());
// Load robots.
game.addRobot(new Tobor(), "Alpha");
// game.addRobot(new Tobor(), "Beta");
// game.addRobot(new Tobor(), "Delta");
// game.addRobot(new Tobor(), "Gamma");
// Game animation loop. The interval sets that animation frame rate in ms.
var intervalID = setInterval(() => game.run(), 100);

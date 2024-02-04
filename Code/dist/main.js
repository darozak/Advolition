"use strict";
const game = new Game(gaia);
// Load robots.
game.addBot(new Tobor(), "Alpha");
game.addBot(new Tobor(), "Beta");
game.addBot(new Tobor(), "Delta");
game.addBot(new Tobor(), "Gamma");
// Game animation loop.
var intervalID = setInterval(() => game.run(), 200);

"use strict";
const game = new Game(gaia);
// Load robots.
game.addBot(new Tobor());
// Game animation loop.
var intervalID = setInterval(() => game.run(), 200);

"use strict";
class Paper {
    canvas;
    CANVAS_WIDTH;
    CANVAS_HEIGHT;
    spriteTileSize = 10;
    renderTileSize = 40;
    image;
    constructor() {
        this.canvas = document.getElementById('canvas1');
        this.image = document.getElementById('source');
        this.CANVAS_HEIGHT = this.canvas.height = 600;
        this.CANVAS_WIDTH = this.canvas.width = 600;
    }
    drawTile(spriteCoord, gridCoord) {
        const ctx = this.canvas.getContext('2d');
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x;
        const ry = this.renderTileSize * gridCoord.y;
        if (ctx) {
            // ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
            ctx.drawImage(this.image, sx, sy, sh, sw, rx, ry, this.renderTileSize, this.renderTileSize);
        }
    }
}

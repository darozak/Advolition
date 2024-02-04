"use strict";
class Paper {
    canvas;
    CANVAS_WIDTH;
    CANVAS_HEIGHT;
    spriteTileSize = 10;
    renderTileSize = 10;
    image;
    ctx;
    constructor() {
        this.canvas = document.getElementById('canvas1');
        this.image = document.getElementById('source');
        this.CANVAS_HEIGHT = this.canvas.height = 600;
        this.CANVAS_WIDTH = this.canvas.width = 1200;
        this.ctx = this.canvas.getContext('2d');
    }
    drawTile(spriteCoord, gridCoord, alpha) {
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x + 20;
        const ry = this.renderTileSize * gridCoord.y + 20;
        const ctx = this.canvas.getContext('2d');
        if (ctx) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(this.image, sx, sy, sh, sw, rx, ry, this.renderTileSize, this.renderTileSize);
        }
    }
    erasePaper() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }
    drawRect(x, y, xsize, ysize) {
        console.log(x, y);
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(x, y, xsize, ysize);
    }
}

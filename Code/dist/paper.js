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
    drawTile(leftFrame, topFrame, spriteCoord, gridCoord, alpha, frame) {
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x + leftFrame;
        const ry = this.renderTileSize * gridCoord.y + topFrame;
        if (frame) {
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'green';
            this.ctx.strokeRect(rx - 2, ry - 2, this.renderTileSize + 4, this.renderTileSize + 4);
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(this.image, sx, sy, sh, sw, rx, ry, this.renderTileSize, this.renderTileSize);
    }
    showStatus(centerFrame, topFrame, title, value) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'rgb(120,120,120)';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(title, centerFrame - 5, topFrame);
        this.ctx.fillStyle = 'rgb(180,180,180)';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(value, centerFrame + 5, topFrame);
    }
    erasePaper() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }
    drawFrame(x, y, xsize, ysize) {
        this.ctx.strokeStyle = "green";
        this.ctx.strokeRect(x, y, xsize, ysize);
    }
}

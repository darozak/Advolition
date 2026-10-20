"use strict";
class Paper {
    canvas;
    CANVAS_WIDTH;
    CANVAS_HEIGHT;
    spriteTileSize = 10;
    renderTileSize = 10;
    image;
    ctx;
    lineSpacing = 14;
    constructor(lineSpacing) {
        this.canvas = document.getElementById('canvas');
        this.image = document.getElementById('sprites');
        this.CANVAS_HEIGHT = this.canvas.height = 1080;
        this.CANVAS_WIDTH = this.canvas.width = 1500;
        this.ctx = this.canvas.getContext('2d');
        this.lineSpacing = lineSpacing;
    }
    printLog(robot, centerFrame, topFrame) {
        this.ctx.font = '12px Arial';
        // Print header
        this.ctx.fillStyle = this.rgbStringFromArray([120, 120, 120]);
        this.ctx.textAlign = 'right';
        this.ctx.fillText("Time", centerFrame - 10, topFrame);
        this.ctx.textAlign = 'left';
        this.ctx.fillText("Action", centerFrame + 10, topFrame);
        topFrame += this.lineSpacing;
        this.ctx.fillStyle = this.rgbStringFromArray([180, 180, 180]);
        for (var i = 0; i < robot.logTime.length; i++) {
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${robot.logTime[i]}`, centerFrame - 10, topFrame);
            this.ctx.textAlign = 'left';
            let repeat = robot.logRepeat[i] > 1 ? ` ×${robot.logRepeat[i]}` : '';
            this.ctx.fillText(this.fitText(robot.logEntry[i] + repeat, 280), centerFrame + 10, topFrame);
            topFrame += this.lineSpacing;
        }
    }
    // Shortens text with "…" so it fits in maxWidth pixels in the current font.
    fitText(text, maxWidth) {
        if (this.ctx.measureText(text).width <= maxWidth)
            return text;
        while (text.length > 1 && this.ctx.measureText(text + '…').width > maxWidth)
            text = text.slice(0, -1);
        return text + '…';
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
    showStatus(centerFrame, topFrame, title, value, valueRGB, forceDisplay) {
        if (value > 0 || forceDisplay) {
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = 'rgb(120,120,120)';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(title, centerFrame - 5, topFrame);
            this.ctx.fillStyle = this.rgbStringFromArray(valueRGB);
            this.ctx.textAlign = 'left';
            this.ctx.fillText(value.toString(), centerFrame + 5, topFrame);
            topFrame += this.lineSpacing;
        }
        return topFrame;
    }
    drawListItem(centerFrame, topFrame, name, rgb) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, centerFrame, topFrame);
    }
    drawBanner(leftFrame, topFrame, text, rgb) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.textAlign = 'left';
        this.ctx.fillText(text, leftFrame, topFrame);
    }
    erasePaper() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }
    drawFrame(x, y, xsize, ysize, rgb = [0, 128, 0]) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.strokeRect(x, y, xsize, ysize);
    }
    // Draws one sprite from the sprite sheet at any size.
    drawSprite(left, top, sprite, size, alpha = 1) {
        const s = this.spriteTileSize;
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(this.image, s * sprite.x, s * sprite.y, s, s, left, top, size, size);
        this.ctx.globalAlpha = 1.0;
    }
    drawText(x, y, text, rgb, align = 'left', font = '12px Arial', alpha = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.fillText(text, x, y);
        this.ctx.globalAlpha = 1.0;
    }
    // A robot: a filled circle in its colour with its number on it.
    drawRobotDot(centerX, centerY, radius, rgb, label, alpha = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = 'black';
        this.ctx.stroke();
        this.ctx.fillStyle = 'black';
        this.ctx.font = `bold ${Math.round(radius * 1.4)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, centerX, centerY + 0.5);
        this.ctx.textBaseline = 'alphabetic';
        this.ctx.globalAlpha = 1.0;
    }
    drawRing(centerX, centerY, radius, rgb, alpha = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1.0;
    }
    drawLine(x1, y1, x2, y2, rgb, alpha = 1, width = 2) {
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1.0;
    }
    drawSquare(x, y, size, rgb, width = 2) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.lineWidth = width;
        this.ctx.strokeRect(x, y, size, size);
        this.ctx.lineWidth = 1;
    }
    rgbStringFromArray(array) {
        while (array.length < 3)
            array.push(0);
        return 'rgb(' + array[0] + ',' + array[1] + ',' + array[2] + ')';
    }
    rgbaStringFromArray(array) {
        while (array.length < 4)
            array.push(0);
        return 'rgba(' + array[0] + ',' + array[1] + ',' + array[2] + ',' + array[3] + ')';
    }
}

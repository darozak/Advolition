class Paper {
    canvas: HTMLCanvasElement;
    CANVAS_WIDTH: number;
    CANVAS_HEIGHT: number;
    spriteTileSize = 10;
    renderTileSize = 10;
    image: CanvasImageSource;
    ctx: CanvasRenderingContext2D;

    
    lineSpacing = 14;

    constructor(lineSpacing: number) {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;       
        this.image = document.getElementById('sprites') as HTMLCanvasElement;
        this.CANVAS_HEIGHT = this.canvas.height = 960;
        this.CANVAS_WIDTH = this.canvas.width = 1500;
        this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
        this.lineSpacing = lineSpacing;
    }

    printLog(robot: RobotData, centerFrame: number, topFrame: number) {
        this.ctx.font = '12px Arial';   

        // Print header
        this.ctx.fillStyle = this.rgbStringFromArray([120, 120, 120]);

        this.ctx.textAlign = 'right'; 
        this.ctx.fillText("Time", centerFrame - 10, topFrame);

        this.ctx.textAlign = 'left';
        this.ctx.fillText("Action", centerFrame + 10, topFrame);

        topFrame += this.lineSpacing;
        
        this.ctx.fillStyle = this.rgbStringFromArray([180, 180, 180]);
        for(var i = 0; i < robot.logTime.length; i ++) {
            
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`${robot.logTime[i]}`, centerFrame - 10, topFrame);

            this.ctx.textAlign = 'left';
            let repeat = robot.logRepeat[i] > 1 ? ` ×${robot.logRepeat[i]}` : '';
            this.ctx.fillText(robot.logEntry[i] + repeat, centerFrame + 10, topFrame);

            topFrame += this.lineSpacing;
        }
    }

    drawTile(leftFrame: number, topFrame: number, spriteCoord: Vector, gridCoord: Vector, alpha: number, frame: boolean) {
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x + leftFrame;
        const ry = this.renderTileSize * gridCoord.y + topFrame;

        if(frame) {
            this.ctx.globalAlpha = 1.0;
            this.ctx.fillStyle = 'green';
            this.ctx.strokeRect(rx-2, ry-2, this.renderTileSize+4, this.renderTileSize+4);
        }
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(this.image,sx,sy,sh,sw, rx, ry, this.renderTileSize, this.renderTileSize);
    }

    showStatus(centerFrame: number, topFrame: number, title: string, value: number, valueRGB: number[], forceDisplay: boolean): number {
        if(value > 0 || forceDisplay) {
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

    drawListItem(centerFrame: number, topFrame: number, name: string, rgb: number[]) {
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.textAlign = 'center';
        this.ctx.fillText(name, centerFrame, topFrame);
    }

    drawBanner(leftFrame: number, topFrame: number, text: string, rgb: number[]) {
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

    drawFrame(x: number, y: number, xsize: number, ysize: number, rgb: number[] = [0, 128, 0]) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.strokeRect(x, y, xsize, ysize);
    }

    // Draws one sprite from the sprite sheet at any size.
    drawSprite(left: number, top: number, sprite: Vector, size: number, alpha: number = 1) {
        const s = this.spriteTileSize;
        this.ctx.globalAlpha = alpha;
        this.ctx.drawImage(this.image, s * sprite.x, s * sprite.y, s, s, left, top, size, size);
        this.ctx.globalAlpha = 1.0;
    }

    drawText(x: number, y: number, text: string, rgb: number[], align: CanvasTextAlign = 'left', font: string = '12px Arial', alpha: number = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.font = font;
        this.ctx.textAlign = align;
        this.ctx.fillStyle = this.rgbStringFromArray(rgb);
        this.ctx.fillText(text, x, y);
        this.ctx.globalAlpha = 1.0;
    }

    // A robot: a filled circle in its colour with its number on it.
    drawRobotDot(centerX: number, centerY: number, radius: number, rgb: number[], label: string, alpha: number = 1) {
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

    drawRing(centerX: number, centerY: number, radius: number, rgb: number[], alpha: number = 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 1.0;
    }

    drawLine(x1: number, y1: number, x2: number, y2: number, rgb: number[], alpha: number = 1, width: number = 2) {
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

    drawSquare(x: number, y: number, size: number, rgb: number[], width: number = 2) {
        this.ctx.globalAlpha = 1.0;
        this.ctx.strokeStyle = this.rgbStringFromArray(rgb);
        this.ctx.lineWidth = width;
        this.ctx.strokeRect(x, y, size, size);
        this.ctx.lineWidth = 1;
    }

    rgbStringFromArray(array: number[]) {
        while(array.length < 3) array.push(0);
        return 'rgb(' + array[0] + ',' + array[1] + ',' + array[2] + ')';
    }

    rgbaStringFromArray(array: number[]) {
        while(array.length < 4) array.push(0);
        return 'rgba(' + array[0] + ',' + array[1] + ',' + array[2] + ',' + array[3] + ')';
    }
}
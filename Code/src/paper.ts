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
        this.CANVAS_HEIGHT = this.canvas.height = 600;
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
            this.ctx.fillText(robot.logEntry[i], centerFrame + 10, topFrame);

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

    erasePaper() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    } 

    drawFrame(x: number, y: number, xsize: number, ysize: number) {
        this.ctx.strokeStyle = "green";
        this.ctx.strokeRect(x, y, xsize, ysize);
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
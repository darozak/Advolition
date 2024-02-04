class Paper {
    canvas: HTMLCanvasElement;
    CANVAS_WIDTH: number;
    CANVAS_HEIGHT: number;
    spriteTileSize = 10;
    renderTileSize = 10;
    image: CanvasImageSource;
    ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.getElementById('canvas1') as HTMLCanvasElement;       
        this.image = document.getElementById('source') as HTMLCanvasElement;
        this.CANVAS_HEIGHT = this.canvas.height = 600;
        this.CANVAS_WIDTH = this.canvas.width = 1200;
        this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
    }

    
    drawTile(leftFrame: number, topFrame: number, spriteCoord: Vector, gridCoord: Vector, alpha: number) {
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x + leftFrame;
        const ry = this.renderTileSize * gridCoord.y + topFrame;

        const ctx = this.canvas.getContext('2d');
        if(ctx){
            ctx.globalAlpha = alpha;
            ctx.drawImage(this.image,sx,sy,sh,sw, rx, ry, this.renderTileSize, this.renderTileSize);
        }
    }

    showStatus(centerFrame: number, topFrame: number, title: string, value: any) {
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

    drawFrame(x: number, y: number, xsize: number, ysize: number) {
        this.ctx.strokeStyle = "green";
        this.ctx.strokeRect(x, y, xsize, ysize);
    }
}
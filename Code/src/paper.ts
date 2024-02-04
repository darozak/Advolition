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

    
    drawTile(spriteCoord: Vector, gridCoord: Vector, alpha: number) {
        const sx = this.spriteTileSize * spriteCoord.x;
        const sy = this.spriteTileSize * spriteCoord.y;
        const sh = this.spriteTileSize;
        const sw = this.spriteTileSize;
        const rx = this.renderTileSize * gridCoord.x + 20;
        const ry = this.renderTileSize * gridCoord.y + 20;

        const ctx = this.canvas.getContext('2d');
        if(ctx){
            ctx.globalAlpha = alpha;
            ctx.drawImage(this.image,sx,sy,sh,sw, rx, ry, this.renderTileSize, this.renderTileSize);
        }
    }

    erasePaper() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }

    drawRect(x: number, y: number, xsize: number, ysize: number) {
        console.log(x, y);
        this.ctx.fillStyle = "green";
        this.ctx.fillRect(x, y, xsize, ysize);
    }
}
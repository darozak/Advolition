class Vector {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    print(): string {
        return '(' + this.x + ', ' + this.y + ')';
    }

    add(vector: Vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    subtract(vector: Vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    isEqualTo(vector: Vector) {
        return (this.x === vector.x && this.y === vector.y);
    }

    setEqualTo(vector: Vector) {
        this.x = vector.x;
        this.y = vector.y;
    }

    getDistanceTo(vector: Vector) {
        let delta = this.subtract(vector);
        return Math.sqrt((Math.pow(delta.x, 2) + Math.pow(delta.y, 2)));
    }

    getPathTo(destination: Vector): Vector[] {

        var path: Vector[] = [];
        var x0 = this.x;
        var y0 = this.y;
        var x1 = destination.x;
        var y1 = destination.y;

        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;

        while(true) {
            path.push(new Vector(x0, y0));        
            if ((x0 === x1) && (y0 === y1)) break;
            var e2 = 2*err;
            if (e2 > -dy) { err -= dy; x0  += sx; }
            if (e2 < dx) { err += dx; y0  += sy; }
        }

        // Only remove starting position if it won't empty the array.
        // Otherwise this could produce an error elsehere.
        if (path.length > 1) {path.shift();}
    
        return path;
    }
}
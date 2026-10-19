"use strict";
class Vector {
    x;
    y;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    print() {
        return '(' + this.x + ', ' + this.y + ')';
    }
    add(vector) {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }
    subtract(vector) {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }
    isEqualTo(vector) {
        return (this.x === vector.x && this.y === vector.y);
    }
    setEqualTo(vector) {
        this.x = vector.x;
        this.y = vector.y;
    }
    getDistanceTo(vector) {
        let delta = this.subtract(vector);
        return Math.sqrt((Math.pow(delta.x, 2) + Math.pow(delta.y, 2)));
    }
    getPathTo(destination) {
        var path = [];
        var x0 = Math.round(this.x);
        var y0 = Math.round(this.y);
        // Round the target to a whole tile. Fractional targets would never be
        // reached exactly and the loop below would run forever.
        var x1 = Math.round(destination.x);
        var y1 = Math.round(destination.y);
        if (!Number.isFinite(x1) || !Number.isFinite(y1))
            return [new Vector(x0, y0)];
        var dx = Math.abs(x1 - x0);
        var dy = Math.abs(y1 - y0);
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx - dy;
        while (true) {
            path.push(new Vector(x0, y0));
            if ((x0 === x1) && (y0 === y1))
                break;
            var e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
        // Only remove starting position if it won't empty the array.
        // Otherwise this could produce an error elsehere.
        if (path.length > 1) {
            path.shift();
        }
        return path;
    }
}

"use strict";
// import FOV, { VisibilityCallback } from "./fov.js";
/**
 * @class Precise shadowcasting algorithm
 * @augments ROT.FOV
 */
// export default 
class PreciseShadowcasting extends FOV {
    /**
     * Guards against queries that are greater than the size of the mask.
     * Returns true or false from the mask array and false of the coordinates
     * are outside the array.
     *
     * @param x
     * @param y
     * @param mask
     * @returns
     */
    _lightPasses(x, y, mask) {
        if (x >= 0 && x <= mask.length && y >= 0 && y <= mask[0].length) {
            return mask[x][y];
        }
        return false;
    }
    /**
     * Computes whether or not a tile is visible based on whether the corresponding
     * point in the boolean mask array is true or false.  A true value in the mask
     * means that liqht can pass through the tile and it doesn't block the scan.
     *
     * The callback function parses the results into an array of values between 0 and 1
     * that indicate whether the particular tile is visible in the scan.
     *
     * @param x The x position of the observer.
     * @param y The y position of the observer.
     * @param R The radius of the scan.
     * @param mask A boolean array that indicates whether light from the can can pass
     * through a particular tile.
     * @returns Returns a 2D array of numbers that is the same size as the mask. The numbers
     * range from 0-1 and indicate the degree to which the tile is visible in the scan.
     */
    compute(x, y, R, mask) {
        // Create a results array that is the same size as the input mask.
        var scanResult = [];
        for (var i = 0; i < mask.length; i++) {
            scanResult[i] = [];
            for (var j = 0; j < mask[0].length; j++) {
                scanResult[i][j] = 0;
            }
        }
        // The observer's tile is always visible.
        scanResult[x][y] = 1;
        /* standing in a dark place. FIXME is this a good idea?  */
        if (!this._lightPasses(x, y, mask)) {
            return scanResult;
        }
        /* list of all shadows */
        let SHADOWS = [];
        let cx, cy, blocks, A1, A2, visibility;
        /* analyze surrounding cells in concentric rings, starting from the center */
        for (let r = 1; r <= R; r++) {
            console.log(r);
            let neighbors = this._getCircle(x, y, r);
            let neighborCount = neighbors.length;
            for (let i = 0; i < neighborCount; i++) {
                cx = neighbors[i][0];
                cy = neighbors[i][1];
                /* shift half-an-angle backwards to maintain consistency of 0-th cells */
                A1 = [i ? 2 * i - 1 : 2 * neighborCount - 1, 2 * neighborCount];
                A2 = [2 * i + 1, 2 * neighborCount];
                blocks = !this._lightPasses(cx, cy, mask);
                visibility = this._checkVisibility(A1, A2, blocks, SHADOWS);
                if (visibility) {
                    scanResult[cx][cy] = visibility;
                }
                if (SHADOWS.length == 2 && SHADOWS[0][0] == 0 && SHADOWS[1][0] == SHADOWS[1][1]) {
                    return scanResult;
                } /* cutoff? */
            } /* for all cells in this ring */
        } /* for all rings */
        return scanResult;
    }
    /**
     * @param {int[2]} A1 arc start
     * @param {int[2]} A2 arc end
     * @param {bool} blocks Does current arc block visibility?
     * @param {int[][]} SHADOWS list of active shadows
     */
    _checkVisibility(A1, A2, blocks, SHADOWS) {
        if (A1[0] > A2[0]) { /* split into two sub-arcs */
            let v1 = this._checkVisibility(A1, [A1[1], A1[1]], blocks, SHADOWS);
            let v2 = this._checkVisibility([0, 1], A2, blocks, SHADOWS);
            return (v1 + v2) / 2;
        }
        /* index1: first shadow >= A1 */
        let index1 = 0, edge1 = false;
        while (index1 < SHADOWS.length) {
            let old = SHADOWS[index1];
            let diff = old[0] * A1[1] - A1[0] * old[1];
            if (diff >= 0) { /* old >= A1 */
                if (diff == 0 && !(index1 % 2)) {
                    edge1 = true;
                }
                break;
            }
            index1++;
        }
        /* index2: last shadow <= A2 */
        let index2 = SHADOWS.length, edge2 = false;
        while (index2--) {
            let old = SHADOWS[index2];
            let diff = A2[0] * old[1] - old[0] * A2[1];
            if (diff >= 0) { /* old <= A2 */
                if (diff == 0 && (index2 % 2)) {
                    edge2 = true;
                }
                break;
            }
        }
        let visible = true;
        if (index1 == index2 && (edge1 || edge2)) { /* subset of existing shadow, one of the edges match */
            visible = false;
        }
        else if (edge1 && edge2 && index1 + 1 == index2 && (index2 % 2)) { /* completely equivalent with existing shadow */
            visible = false;
        }
        else if (index1 > index2 && (index1 % 2)) { /* subset of existing shadow, not touching */
            visible = false;
        }
        if (!visible) {
            return 0;
        } /* fast case: not visible */
        let visibleLength;
        /* compute the length of visible arc, adjust list of shadows (if blocking) */
        let remove = index2 - index1 + 1;
        if (remove % 2) {
            if (index1 % 2) { /* first edge within existing shadow, second outside */
                let P = SHADOWS[index1];
                visibleLength = (A2[0] * P[1] - P[0] * A2[1]) / (P[1] * A2[1]);
                if (blocks) {
                    SHADOWS.splice(index1, remove, A2);
                }
            }
            else { /* second edge within existing shadow, first outside */
                let P = SHADOWS[index2];
                visibleLength = (P[0] * A1[1] - A1[0] * P[1]) / (A1[1] * P[1]);
                if (blocks) {
                    SHADOWS.splice(index1, remove, A1);
                }
            }
        }
        else {
            if (index1 % 2) { /* both edges within existing shadows */
                let P1 = SHADOWS[index1];
                let P2 = SHADOWS[index2];
                visibleLength = (P2[0] * P1[1] - P1[0] * P2[1]) / (P1[1] * P2[1]);
                if (blocks) {
                    SHADOWS.splice(index1, remove);
                }
            }
            else { /* both edges outside existing shadows */
                if (blocks) {
                    SHADOWS.splice(index1, remove, A1, A2);
                }
                return 1; /* whole arc visible! */
            }
        }
        let arcLength = (A2[0] * A1[1] - A1[0] * A2[1]) / (A1[1] * A2[1]);
        return visibleLength / arcLength;
    }
}

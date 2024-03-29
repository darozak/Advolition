/**
 * This code imported from routines described in the ROguelike Toolkit in JavaScript repository
 * (https://github.com/ondras/rot.js) and adapted slightly to meet the needs of this application.
 */

interface VisibilityCallback { (x: number, y: number, r: number, visibility: number): void };
 
interface FovOptions {
	topology: 4 | 6 | 8
}

const DIRS = {
	4: [[0, -1], [1, 0], [0, 1], [-1, 0]],
	8: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
	6: [[-1, -1], [1, -1], [2, 0], [1, 1], [-1, 1], [-2, 0]]
};

abstract class FOV {
	_options: FovOptions;

	/**
	 * @class Abstract FOV algorithm
	 * @param {object} [options]
	 * @param {int} [options.topology=8] 4/6/8
	 */
	constructor( options: Partial<FovOptions> = {}) {
		this._options = Object.assign({topology: 8}, options);
	}

	/**
	 * Compute visibility for a 360-degree circle
	 * @param {int} x The x position of the observer.
	 * @param {int} y The y position of the observer.
	 * @param {int} R Maximum visibility radius of the scan.
	 * @param {boolen} mask A boolean array to indicate which tiles allow the light from the scan
	 * to pass through them.
	 * @param {function} callback A callback function that parses the returned visibility value
	 * for each tile in the scanned radius.
	 */
	abstract compute(x: number, y: number, R: number, mask: boolean[][], callback: VisibilityCallback): void;

	/**
	 * Return all neighbors in a concentric ring
	 * @param {int} cx center-x
	 * @param {int} cy center-y
	 * @param {int} r range
	 */
	_getCircle(cx: number, cy: number, r: number) {
		let result = [];
		let dirs, countFactor, startOffset;

		switch (this._options.topology) {
			case 4:
				countFactor = 1;
				startOffset = [0, 1];
				dirs = [
					DIRS[8][7],
					DIRS[8][1],
					DIRS[8][3],
					DIRS[8][5]
				];
			break;

			case 6:
				dirs = DIRS[6];
				countFactor = 1;
				startOffset = [-1, 1];
			break;

			case 8:
				dirs = DIRS[4];
				countFactor = 2;
				startOffset = [-1, 1];
			break;

			default:
				throw new Error("Incorrect topology for FOV computation");
			break;
		}

		/* starting neighbor */
		let x = cx + startOffset[0]*r;
		let y = cy + startOffset[1]*r;

		/* circle */
		for (let i=0;i<dirs.length;i++) {
			for (let j=0;j<r*countFactor;j++) {
				result.push([x, y]);
				x += dirs[i][0];
				y += dirs[i][1];

			}
		}

		return result;
	}
}
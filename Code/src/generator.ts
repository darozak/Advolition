/**
 * This code imported from routines described in the ROguelike Toolkit in JavaScript repository
 * (https://github.com/ondras/rot.js) and adapted slightly to meet the needs of this application.
 */

var rng = new RNG();
rng.setSeed(Date.now());

interface RoomOptions {
	roomWidth: [number, number];
	roomHeight: [number, number];
}

interface CorridorOptions {
	corridorLength: [number, number];
}

interface FeatureOptions extends RoomOptions, CorridorOptions {};

interface FeatureConstructor {
	createRandomAt: (x: number, y: number, dx: number, dy: number, options: FeatureOptions) => Feature;
}

interface DigCallback { (x: number, y: number, value: number): void; }
interface TestPositionCallback { (x: number, y: number): boolean; }

/**
 * @class Dungeon feature; has own .create() method
 */
abstract class Feature {
	abstract isValid(isWallCallback: TestPositionCallback, canBeDugCallback: TestPositionCallback): boolean;
	abstract create(digCallback: DigCallback): void;
	abstract debug(): void;
}

/**
 * @class Room
 * @augments ROT.Map.Feature
 * @param {int} x1
 * @param {int} y1
 * @param {int} x2
 * @param {int} y2
 * @param {int} [doorX]
 * @param {int} [doorY]
 */
class Room extends Feature {
	_x1: number;
	_y1: number;
	_x2: number;
	_y2: number;
	_doors: { [key:string]: number };

	constructor(x1: number, y1: number, x2: number, y2: number, doorX?: number, doorY?: number) {
		super();
		this._x1 = x1;
		this._y1 = y1;
		this._x2 = x2;
		this._y2 = y2;
		this._doors = {};
		if (doorX !== undefined && doorY !== undefined) { this.addDoor(doorX, doorY); }
	};

	/**
	 * Room of random size, with a given doors and direction
	 */
	static createRandomAt(x:number, y:number, dx:number, dy:number, options: RoomOptions) {
		let min = options.roomWidth[0];
		let max = options.roomWidth[1];
		let width = rng.getUniformInt(min, max);
		
		min = options.roomHeight[0];
		max = options.roomHeight[1];
		let height = rng.getUniformInt(min, max);
		
		if (dx == 1) { /* to the right */
			let y2 = y - Math.floor(rng.getUniform() * height);
			return new this(x+1, y2, x+width, y2+height-1, x, y);
		}
		
		if (dx == -1) { /* to the left */
			let y2 = y - Math.floor(rng.getUniform() * height);
			return new this(x-width, y2, x-1, y2+height-1, x, y);
		}

		if (dy == 1) { /* to the bottom */
			let x2 = x - Math.floor(rng.getUniform() * width);
			return new this(x2, y+1, x2+width-1, y+height, x, y);
		}

		if (dy == -1) { /* to the top */
			let x2 = x - Math.floor(rng.getUniform() * width);
			return new this(x2, y-height, x2+width-1, y-1, x, y);
		}

		throw new Error("dx or dy must be 1 or -1");
	}

	/**
	 * Room of random size, positioned around center coords
	 */
	static createRandomCenter(cx: number, cy: number, options: RoomOptions) {
		let min = options.roomWidth[0];
		let max = options.roomWidth[1];
		let width = rng.getUniformInt(min, max);
		
		min = options.roomHeight[0];
		max = options.roomHeight[1];
		let height = rng.getUniformInt(min, max);

		let x1 = cx - Math.floor(rng.getUniform()*width);
		let y1 = cy - Math.floor(rng.getUniform()*height);
		let x2 = x1 + width - 1;
		let y2 = y1 + height - 1;

		return new this(x1, y1, x2, y2);
	}

	/**
	 * Room of random size within a given dimensions
	 */
	static createRandom(availWidth: number, availHeight: number, options: RoomOptions) {
		let min = options.roomWidth[0];
		let max = options.roomWidth[1];
		let width = rng.getUniformInt(min, max);
		
		min = options.roomHeight[0];
		max = options.roomHeight[1];
		let height = rng.getUniformInt(min, max);
		
		let left = availWidth - width - 1;
		let top = availHeight - height - 1;

		let x1 = 1 + Math.floor(rng.getUniform()*left);
		let y1 = 1 + Math.floor(rng.getUniform()*top);
		let x2 = x1 + width - 1;
		let y2 = y1 + height - 1;

		return new this(x1, y1, x2, y2);
	}

	addDoor(x: number, y: number) {
		this._doors[x+","+y] = 1;
		return this;
	}

	/**
	 * @param {function}
	 */
	getDoors(cb: (x:number, y:number) => void) {
		for (let key in this._doors) {
			let parts = key.split(",");
			cb(parseInt(parts[0]), parseInt(parts[1]));
		}
		return this;
	}

	clearDoors() {
		this._doors = {};
		return this;
	}

	addDoors(isWallCallback: TestPositionCallback) {
		let left = this._x1-1;
		let right = this._x2+1;
		let top = this._y1-1;
		let bottom = this._y2+1;

		for (let x=left; x<=right; x++) {
			for (let y=top; y<=bottom; y++) {
				if (x != left && x != right && y != top && y != bottom) { continue; }
				if (isWallCallback(x, y)) { continue; }

				this.addDoor(x, y);
			}
		}

		return this;
	}

	debug() {
		console.log("room", this._x1, this._y1, this._x2, this._y2);
	}

	isValid(isWallCallback: TestPositionCallback, canBeDugCallback: TestPositionCallback) { 
		let left = this._x1-1;
		let right = this._x2+1;
		let top = this._y1-1;
		let bottom = this._y2+1;
		
		for (let x=left; x<=right; x++) {
			for (let y=top; y<=bottom; y++) {
				if (x == left || x == right || y == top || y == bottom) {
					if (!isWallCallback(x, y)) { return false; }
				} else {
					if (!canBeDugCallback(x, y)) { return false; }
				}
			}
		}

		return true;
	}

	/**
	 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty, 1 = wall, 2 = door. Multiple doors are allowed.
	 */
	create(digCallback: DigCallback) { 
		let left = this._x1-1;
		let right = this._x2+1;
		let top = this._y1-1;
		let bottom = this._y2+1;
		
		let value = 0;
		for (let x=left; x<=right; x++) {
			for (let y=top; y<=bottom; y++) {
				if (x+","+y in this._doors) {
					value = 2;
				} else if (x == left || x == right || y == top || y == bottom) {
					value = 1;
				} else {
					value = 0;
				}
				digCallback(x, y, value);
			}
		}
	}

	getCenter() {
		return [Math.round((this._x1 + this._x2)/2), Math.round((this._y1 + this._y2)/2)];
	}

	getLeft() { return this._x1; }
	getRight() { return this._x2; }
	getTop() { return this._y1; }
	getBottom() { return this._y2; }
}

/**
 * @class Corridor
 * @augments ROT.Map.Feature
 * @param {int} startX
 * @param {int} startY
 * @param {int} endX
 * @param {int} endY
 */
class Corridor extends Feature {
	_startX: number;
	_startY: number;
	_endX: number;
	_endY: number;
	_endsWithAWall: boolean;

	constructor(startX: number, startY: number, endX: number, endY: number) {
		super();
		this._startX = startX;
		this._startY = startY;
		this._endX = endX; 
		this._endY = endY;
		this._endsWithAWall = true;
	}

	static createRandomAt(x: number, y: number, dx: number, dy: number, options: CorridorOptions) {
		let min = options.corridorLength[0];
		let max = options.corridorLength[1];
		let length = rng.getUniformInt(min, max);
		
		return new this(x, y, x + dx*length, y + dy*length);
	}

	debug() {
		console.log("corridor", this._startX, this._startY, this._endX, this._endY);
	}

	isValid(isWallCallback: TestPositionCallback, canBeDugCallback: TestPositionCallback){ 
		let sx = this._startX;
		let sy = this._startY;
		let dx = this._endX-sx;
		let dy = this._endY-sy;
		let length = 1 + Math.max(Math.abs(dx), Math.abs(dy));
		
		if (dx) { dx = dx/Math.abs(dx); }
		if (dy) { dy = dy/Math.abs(dy); }
		let nx = dy;
		let ny = -dx;
		
		let ok = true;
		for (let i=0; i<length; i++) {
			let x = sx + i*dx;
			let y = sy + i*dy;

			if (!canBeDugCallback(     x,      y)) { ok = false; }
			if (!isWallCallback  (x + nx, y + ny)) { ok = false; }
			if (!isWallCallback  (x - nx, y - ny)) { ok = false; }
			
			if (!ok) {
				length = i;
				this._endX = x-dx;
				this._endY = y-dy;
				break;
			}
		}
		
		/**
		 * If the length degenerated, this corridor might be invalid
		 */
		 
		/* not supported */
		if (length == 0) { return false; } 
		
		 /* length 1 allowed only if the next space is empty */
		if (length == 1 && isWallCallback(this._endX + dx, this._endY + dy)) { return false; }
		
		/**
		 * We do not want the corridor to crash into a corner of a room;
		 * if any of the ending corners is empty, the N+1th cell of this corridor must be empty too.
		 * 
		 * Situation:
		 * #######1
		 * .......?
		 * #######2
		 * 
		 * The corridor was dug from left to right.
		 * 1, 2 - problematic corners, ? = N+1th cell (not dug)
		 */
		let firstCornerBad = !isWallCallback(this._endX + dx + nx, this._endY + dy + ny);
		let secondCornerBad = !isWallCallback(this._endX + dx - nx, this._endY + dy - ny);
		this._endsWithAWall = isWallCallback(this._endX + dx, this._endY + dy);
		if ((firstCornerBad || secondCornerBad) && this._endsWithAWall) { return false; }

		return true;
	}

	/**
	 * @param {function} digCallback Dig callback with a signature (x, y, value). Values: 0 = empty.
	 */
	create(digCallback: DigCallback) { 
		let sx = this._startX;
		let sy = this._startY;
		let dx = this._endX-sx;
		let dy = this._endY-sy;
		let length = 1+Math.max(Math.abs(dx), Math.abs(dy));
		
		if (dx) { dx = dx/Math.abs(dx); }
		if (dy) { dy = dy/Math.abs(dy); }
		
		for (let i=0; i<length; i++) {
			let x = sx + i*dx;
			let y = sy + i*dy;
			digCallback(x, y, 0);
		}
		
		return true;
	}

	createPriorityWalls(priorityWallCallback: (x:number, y:number) => void) {
		if (!this._endsWithAWall) { return; }

		let sx = this._startX;
		let sy = this._startY;

		let dx = this._endX-sx;
		let dy = this._endY-sy;
		if (dx) { dx = dx/Math.abs(dx); }
		if (dy) { dy = dy/Math.abs(dy); }
		let nx = dy;
		let ny = -dx;

		priorityWallCallback(this._endX + dx, this._endY + dy);
		priorityWallCallback(this._endX + nx, this._endY + ny);
		priorityWallCallback(this._endX - nx, this._endY - ny);
	}
}

interface CreateCallback { (x: number, y: number, contents: number): any };

abstract class DungeonMap {
	_width: number;
	_height: number;

	/**
	 * @class Base map generator
	 * @param {int} [width=ROT.DEFAULT_WIDTH]
	 * @param {int} [height=ROT.DEFAULT_HEIGHT]
	 */
	constructor(width = 50, height = 50) {
		this._width = width;
		this._height = height;
	};

	abstract create(callback?: CreateCallback): void;

	_fillMap(value: number) {
		let map: number[][] = [];
		for (let i=0;i<this._width;i++) {
			map.push([]);
			for (let j=0;j<this._height;j++) { map[i].push(value); }
		}
		return map;
	}
}

/**
 * @class Dungeon map: has rooms and corridors
 * @augments ROT.Map
 */
abstract class Dungeon extends DungeonMap {
	_rooms: Room[];
	_corridors: Corridor[];

	constructor(width: number, height: number) {
		super(width, height);
		this._rooms = [];
		this._corridors = [];
	}

	/**
	 * Get all generated rooms
	 * @returns {ROT.Map.Feature.Room[]}
	 */
	getRooms() { return this._rooms; }

	/**
	 * Get all generated corridors
	 * @returns {ROT.Map.Feature.Corridor[]}
	 */
	getCorridors() { return this._corridors; }
}

type FeatureType = "room" | "corridor";
const FEATURES = {
	"room": Room,
	"corridor": Corridor
}

interface Options {
	roomWidth: [number, number];
	roomHeight: [number, number];
	corridorLength: [number, number];
	dugPercentage: number;
	timeLimit: number
}

/**
 * Random dungeon generator using human-like digging patterns.
 * Heavily based on Mike Anderson's ideas from the "Tyrant" algo, mentioned at 
 * http://roguebasin.com/index.php/Dungeon-Building_Algorithm
 */
class Digger extends Dungeon {
	_options: Options;
	_featureAttempts: number;
	_map: number[][];
	_walls: { [key:string]: number };
	_dug: number;
	_features: { [key:string]: number };

	constructor(width: number, height: number, options: Partial<Options> = {}) {
		super(width, height);
		
		this._options = Object.assign({
			roomWidth: [3, 9], /* room minimum and maximum width */
			roomHeight: [3, 5], /* room minimum and maximum height */
			corridorLength: [3, 10], /* corridor minimum and maximum length */
			dugPercentage: 0.2, /* we stop after this percentage of level area has been dug out */
			timeLimit: 1000 /* we stop after this much time has passed (msec) */
		}, options);
		
		this._features = {
			"room": 4,
			"corridor": 4
		};
		this._map = [];
		this._featureAttempts = 20; /* how many times do we try to create a feature on a suitable wall */
		this._walls = {}; /* these are available for digging */
		this._dug = 0;

		this._digCallback = this._digCallback.bind(this);
		this._canBeDugCallback = this._canBeDugCallback.bind(this);
		this._isWallCallback = this._isWallCallback.bind(this);
		this._priorityWallCallback = this._priorityWallCallback.bind(this);
	}

	create(callback?: CreateCallback) {
		this._rooms = [];
		this._corridors = [];
		this._map = this._fillMap(1);
		this._walls = {};
		this._dug = 0;
		let area = (this._width-2) * (this._height-2);

		this._firstRoom();
		
		let t1 = Date.now();

		let priorityWalls;
		do {
			priorityWalls = 0;
			let t2 = Date.now();
			if (t2 - t1 > this._options.timeLimit) { break; }

			/* find a good wall */
			let wall = this._findWall();
			if (!wall) { break; } /* no more walls */
			
			let parts = wall.split(",");
			let x = parseInt(parts[0]);
			let y = parseInt(parts[1]);
			let dir = this._getDiggingDirection(x, y);
			if (!dir) { continue; } /* this wall is not suitable */

			/* try adding a feature */
			let featureAttempts = 0;
			do {
				featureAttempts++;
				if (this._tryFeature(x, y, dir[0], dir[1])) { /* feature added */
					//if (this._rooms.length + this._corridors.length == 2) { this._rooms[0].addDoor(x, y); } /* first room oficially has doors */
					this._removeSurroundingWalls(x, y);
					this._removeSurroundingWalls(x-dir[0], y-dir[1]);
					break; 
				}
			} while (featureAttempts < this._featureAttempts);
			
			for (let id in this._walls) { 
				if (this._walls[id] > 1) { priorityWalls++; }
			}

		} while (this._dug/area < this._options.dugPercentage || priorityWalls); /* fixme number of priority walls */

		this._addDoors();

		if (callback) {
			for (let i=0;i<this._width;i++) {
				for (let j=0;j<this._height;j++) {
					callback(i, j, this._map[i][j]);
				}
			}
		}
		
		this._walls = {};
		this._map = [];

		return this;
	}

	_digCallback(x: number, y: number, value: number) {
		if (value == 0 || value == 2) { /* empty */
			this._map[x][y] = 0;
			this._dug++;
		} else { /* wall */
			this._walls[x+","+y] = 1;
		}
	}

	_isWallCallback(x: number, y: number) {
		if (x < 0 || y < 0 || x >= this._width || y >= this._height) { return false; }
		return (this._map[x][y] == 1);
	}

	_canBeDugCallback(x: number, y: number) {
		if (x < 1 || y < 1 || x+1 >= this._width || y+1 >= this._height) { return false; }
		return (this._map[x][y] == 1);
	}

	_priorityWallCallback(x: number, y: number) { this._walls[x+","+y] = 2; };

	_firstRoom() {
		let cx = Math.floor(this._width/2);
		let cy = Math.floor(this._height/2);
		let room = Room.createRandomCenter(cx, cy, this._options);
		this._rooms.push(room);
		room.create(this._digCallback);
	}

	/**
	 * Get a suitable wall
	 */
	_findWall() {
		let prio1 = [];
		let prio2 = [];
		for (let id in this._walls) {
			let prio = this._walls[id];
			if (prio == 2) { 
				prio2.push(id); 
			} else {
				prio1.push(id);
			}
		}
		
		let arr = (prio2.length ? prio2 : prio1);
		if (!arr.length) { return null; } /* no walls :/ */
		
		let id = rng.getItem(arr.sort()) as string; // sort to make the order deterministic
		delete this._walls[id];

		return id;
	}

	/**
	 * Tries adding a feature
	 * @returns {bool} was this a successful try?
	 */
	_tryFeature(x: number, y: number, dx: number, dy: number) {
		let featureName = rng.getWeightedValue(this._features) as FeatureType;
		let ctor = FEATURES[featureName] as FeatureConstructor;
		let feature = ctor.createRandomAt(x, y, dx, dy, this._options);
		
		if (!feature.isValid(this._isWallCallback, this._canBeDugCallback)) {
	//		console.log("not valid");
	//		feature.debug();
			return false;
		}
		
		feature.create(this._digCallback);
	//	feature.debug();

		if (feature instanceof Room) { this._rooms.push(feature); }
		if (feature instanceof Corridor) { 
			feature.createPriorityWalls(this._priorityWallCallback);
			this._corridors.push(feature); 
		}
		
		return true;
	}

	_removeSurroundingWalls(cx: number, cy: number) {
		let deltas = DIRS[4];

		for (let i=0;i<deltas.length;i++) {
			let delta = deltas[i];
			let x = cx + delta[0];
			let y = cy + delta[1];
			delete this._walls[x+","+y];
			x = cx + 2*delta[0];
			y = cy + 2*delta[1];
			delete this._walls[x+","+y];
		}
	}

	/**
	 * Returns vector in "digging" direction, or false, if this does not exist (or is not unique)
	 */
	_getDiggingDirection(cx: number, cy: number) {
		if (cx <= 0 || cy <= 0 || cx >= this._width - 1 || cy >= this._height - 1) { return null; }

		let result = null;
		let deltas = DIRS[4];
		
		for (let i=0;i<deltas.length;i++) {
			let delta = deltas[i];
			let x = cx + delta[0];
			let y = cy + delta[1];
			
			if (!this._map[x][y]) { /* there already is another empty neighbor! */
				if (result) { return null; }
				result = delta;
			}
		}
		
		/* no empty neighbor */
		if (!result) { return null; }
		
		return [-result[0], -result[1]];
	}

	/**
	 * Find empty spaces surrounding rooms, and apply doors.
	 */
	_addDoors() {
		let data = this._map;
		function isWallCallback(x: number, y: number) {
			return (data[x][y] == 1);
		};
		for (let i = 0; i < this._rooms.length; i++ ) {
			let room = this._rooms[i];
			room.clearDoors();
			room.addDoors(isWallCallback);
		}
	}
}
"use strict";
class Robot {
    #stats = {
        xpos: 3,
        ypos: 4,
        xtarg: 0,
        ytarg: 0,
        speed: 1.0 // Meters per second
    };
    #data;
    #dungeon;
    constructor(data) {
        this.#data = data;
        this.#dungeon = new Dungeon(data);
    }
    move(dir) {
        if (dir == 1 || dir == 2 || dir == 3) {
            this.#stats.xtarg = this.#stats.xpos + 1;
        }
        else if (dir == 5 || dir == 6 || dir == 7) {
            this.#stats.xtarg = this.#stats.xpos - 1;
        }
        else {
            this.#stats.xtarg = this.#stats.xpos;
        }
        if (dir == 7 || dir == 0 || dir == 1) {
            this.#stats.ytarg = this.#stats.ypos - 1;
        }
        else if (dir == 3 || dir == 4 || dir == 5) {
            this.#stats.ytarg = this.#stats.ypos + 1;
        }
        else {
            this.#stats.ytarg = this.#stats.ypos;
        }
        if (this.#dungeon.getTileSpeed(this.stats.xtarg, this.stats.ytarg) > 0) {
            this.#stats.xpos = this.#stats.xtarg;
            this.#stats.ypos = this.#stats.ytarg;
        }
    }
    get stats() {
        return this.#stats;
    }
}

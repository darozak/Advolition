class Robot {
    #xpos = 0;
    #ypos = 0;

    constructor(x, y) {
        this.#xpos = x;
        this.#ypos = y;
    }

    move(dir) {
        if(dir == 1 || dir == 2 || dir == 3) {
            this.#xpos += 1;
        } else if (dir == 5 || dir == 6 || dir == 7) {
            this.#xpos -= 1;
        }

        if(dir == 7 || dir == 0 || dir == 1) {
            this.#ypos -= 1;
        } else if (dir == 3 || dir == 4 || dir == 5) {
            this.#ypos += 1;
        }
    }

    get xpos() {
        return this.#xpos;
    } 

    get ypos() {
        return this.#ypos;
    }
}
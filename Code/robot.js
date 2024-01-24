class Robot {
    #xpos = 3;
    #ypos = 3;

    #data = null;
    #dungeon = null;
    
    constructor(data) {
        this.data = data;
        this.#dungeon = new Dungeon(data);
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
        console.log(this.#xpos, " ", this.#ypos, ": ",this.#dungeon.getObject(this.#xpos,this.#ypos));
        console.log(this.#dungeon.getObject(1,1));
    }

    get xpos() {
        return this.#xpos;
    } 

    get ypos() {
        return this.#ypos;
    }
}
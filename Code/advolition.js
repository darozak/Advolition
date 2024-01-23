class Advolition {

    #robot = new Robot(1,1);

    #map = [
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1]
    ]

    constructor() {
      console.log("Advolition constructed");
    }

    enter() {

    }

    whereAmI() {
        console.log(this.#robot.xpos);
    }

    look(x, y) {
        return this.#map[x][y]
    }

    set(x,y,n) {
        this.#map[x][y] = n
    }

    hello() {
        console.log(this.look(0,0));
    }
  }
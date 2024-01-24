class Advolition {

    #data = null;
    #robot = new Robot(1,1);

    #map = [
        [1,1,1,1,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,0,0,0,1],
        [1,1,1,1,1]
    ]

    constructor(data) {
        this.#data = data;
        console.log("Advolition constructed");
        console.log(this.#data.objects[0].name);
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
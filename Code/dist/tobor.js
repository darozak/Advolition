"use strict";
class Tobor extends Robot {
    state = "start";
    evaluate(world, status, call) {
        switch (this.state) {
            case "start":
                console.log("I am Tobor!");
                call.scan(10);
                this.state = "target";
                return;
            case "target":
                console.log(status.scan);
                this.state = "end";
                return;
            case "end":
                return;
        }
    }
}

"use strict";
class Tobor extends Robot {
    state = "start";
    evaluate(world, status, call) {
        console.log("My turn!");
        switch (this.state) {
            case "start":
                console.log("I am Tobor!");
                call.scan(10);
                this.state = "target";
                return;
            case "target":
                console.log("target state");
                console.log(status.scan);
                this.state = "end";
                return;
            case "end":
                console.log("end state");
                return;
        }
    }
}

"use strict";
class Tobor extends Program {
    state = "start";
    run(myID, myData, myAction) {
        var destination = new Vector(4, 4);
        switch (this.state) {
            case "start":
                myAction.scan(0);
                this.state = "move";
                return;
            case "move":
                console.log("move state");
                myAction.move(1, destination);
                this.state = "scan";
                return;
            case "scan":
                console.log("scan state");
                myAction.scan(2);
                console.log(myData.robots[myID].core.mass);
                this.state = "end";
                return;
            case "end":
                console.log("end state");
                myAction.move(0, destination);
                // call.scan(2);
                return;
        }
    }
}

"use strict";
class Tobor extends Program {
    state = "start";
    actionBuffer = [];
    run(myID, myData, myAction) {
        var destination = new Vector(4, 4);
        var target = new Vector(1, 2);
        // myAction = new Scan(2);
        if (this.actionBuffer.length < 1) {
            switch (this.state) {
                case "start":
                    console.log("I'm back");
                    this.actionBuffer.push(new Scan(0));
                    this.actionBuffer.push(new Scan(2));
                    this.actionBuffer.push(new Move(2, destination));
                    if (myData.robots[myID].battery.currentPower < 100)
                        this.state = "recharge";
                    break;
                case "recharge":
                    this.actionBuffer.push(new Activate(target));
                    this.state = "start";
                    break;
                case "move":
                    console.log("move state");
                    this.actionBuffer.push(new Move(2, destination));
                    this.state = "scan";
                    break;
                case "scan":
                    console.log("scan state");
                    this.actionBuffer.push(new Scan(0));
                    console.log(myData.robots[myID].core.mass);
                    this.state = "end";
                    break;
                case "end":
                    console.log("end state");
                    this.actionBuffer.push(new Move(2, destination));
                    break;
            }
        }
        if (this.actionBuffer.length > 0) {
            myAction = this.actionBuffer[0];
            this.actionBuffer.shift();
        }
        return myAction;
    }
}

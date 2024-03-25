"use strict";
class Tobor extends Program {
    state = "equip";
    actionBuffer = [];
    target = new Vector(3, 6);
    run(myData) {
        var myAction = new Action();
        var destination = new Vector(1, 4);
        var destination2 = new Vector(6, 3);
        var myID = myData.myID;
        if (this.actionBuffer.length < 1) {
            switch (this.state) {
                case 'equip':
                    this.actionBuffer.push(new Activate('Scanner'));
                    this.actionBuffer.push(new Activate('Battery'));
                    this.actionBuffer.push(new Activate('Armor'));
                    this.state = 'start';
                    break;
                case "start":
                    let myPosition = myData.robots[myID].pos;
                    this.actionBuffer.push(new Scan());
                    this.actionBuffer.push(new Move(destination));
                    if (myPosition.x === destination.x && myPosition.y === destination.y)
                        this.state = "attack";
                    break;
                case "attack":
                    this.actionBuffer.push(new Attack(this.target));
                    this.actionBuffer.push(new Attack(this.target));
                    this.actionBuffer.push(new Attack(this.target));
                    this.state = "end";
                    break;
                case "move":
                    this.actionBuffer.push(new Move(destination));
                    this.state = "scan";
                    break;
                case "scan":
                    this.actionBuffer.push(new Scan());
                    this.actionBuffer.push(new Move(destination2));
                    this.state = "scan";
                    break;
                case "end":
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
new Tobor();

class Tobor extends Program {
    state = "start";

    run(myID: number, myData: ScanData, myAction: Action) {
        var destination = new Vector(4,4);

        switch (this.state) {
            case "start":
                myAction.scan(2);    
                if(myData.robots[myID].battery.currentPower < 100) this.state = "recharge";
                return;
            case "recharge":
                myAction.activate(new Vector(1,2));
                this.state = "start";
                return;
            case "move":
                console.log("move state");
                myAction.move(1, destination);
                this.state = "scan";
                return;
            case "scan":
                console.log("scan state");
                myAction.scan(0);
                console.log(myData.robots[myID].core.mass);
                this.state = "end";
                return;
            case "end":
                console.log("end state");
                myAction.move(0, destination);
                // myAction.scan(0);
                return;
        }
    }
}
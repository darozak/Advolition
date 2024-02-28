class Tobor extends Program {
    state = "start";
    actionBuffer: Action[] = [];
    
    run(myID: number, myData: ScanData, myAction: Action) {
        var destination = new Vector(3,3);
        var destination2 = new Vector(6,3);
        var target = new Vector(3, 4);

        // myAction = new Scan();
    
        if(this.actionBuffer.length < 1) {
            
            switch (this.state) {
                case "start": 
                console.log("I'm back");
                    let myPosition = myData.robots[myID].pos;
                    this.actionBuffer.push(new Activate('Blaster'));
                    this.actionBuffer.push(new Activate('Shield'));
                    this.actionBuffer.push(new Activate('Battery'));
                    this.actionBuffer.push(new Drop('Shield'));
                    // this.actionBuffer.push(new Scan()); 
                    this.actionBuffer.push(new Scan());
                    this.actionBuffer.push(new Take('Shield'));
                    this.actionBuffer.push(new Move(destination));  
                    if(myPosition.x === destination.x && myPosition.y === destination.y) this.state = "activate";
                    // if(myData.robots[myID].battery.currentPower < 100) this.state = "recharge";
                    break;
                case "activate":
                    console.log("Opening door");
                    this.actionBuffer.push(new Activate('Vorpal Sword'));
                    this.actionBuffer.push(new Inactivate('Blaster'));
                    
                    this.state = "scan";
                    break;
                case "move":
                    // console.log("move state");
                    this.actionBuffer.push(new Move(destination)); 
                    this.state = "scan";
                    break;
                case "scan":
                    console.log("scan state");
                    this.actionBuffer.push(new Scan()); 
                    this.actionBuffer.push(new Scan());
                    this.actionBuffer.push(new Move(destination2));
                    // console.log(myData.robots[myID].core.mass);
                    this.state = "scan";
                    break;
                case "end":
                    console.log("end state");
                    this.actionBuffer.push(new Move(destination));
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
class Tobor extends Robot {
    state = "start";

    evaluate(world: World, status: Status, call: Call) {
        console.log("My turn!")
        var destination = new Vector(4,4);

        switch (this.state) {
            case "start":
                console.log("I am Tobor!");
                call.scan(0);    
                this.state = "move";
                return;
            case "move":
                console.log("move state");
                call.move(1, destination);
                this.state = "scan";
                return;
            case "scan":
                console.log("scan state");
                call.scan(2);
                console.log(status.scan);
                this.state = "end";
                return;
            case "end":
                console.log("end state");
                call.move(0, destination);
                return;
        }
    }
}
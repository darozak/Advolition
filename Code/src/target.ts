class Target extends Program {
    state = 'start';
    actionBuffer: Action[] = [];

    run(myID: number, myData: ScanData, myAction: Action) {
        // Do nothing.
        if(this.actionBuffer.length < 1) {
            switch(this.state) {
                case 'start':
                    this.actionBuffer.push(new Activate('Armor'));
                    this.actionBuffer.push(new Activate('Shield'));
                    this.state = 'stop';
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
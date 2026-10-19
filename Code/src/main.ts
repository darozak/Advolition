var intervalID = 0;
var robotCount = 4;

var robotCodes: string[] = [];
for(var i = 0; i < robotCount; i ++) robotCodes.push('Empty');

function loadFile(robotNumber: number, fileSelector: HTMLInputElement) {
    // Read from the file input that triggered this call.
    const file = fileSelector.files;

    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      () => {
        robotCodes[robotNumber] = reader.result as string;
      },
      false,
    );
  
    if (file && file.length > 0) {
      reader.readAsText(file[0]);
    }
  }
  
function runGame() {

    const game = new Game(new GaiaData(), 10000); 

    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);

    // Link to the HTML text area that contains the robot code.
    const robotCode = document.querySelector(".robotCode") as HTMLParagraphElement;

    // Evaluate the robotCodes to create a new program object.
    for(var i = 0; i < robotCodes.length; i ++) {   
      if(robotCodes[i] != 'Empty') {
        game.addRobot(eval(robotCodes[i]) as Program, `Robot ${i + 1}`, true); 
      // } else {
      //   game.addRobot(new Target(), `Robot ${i + 1}`, false);
      } 
    }

    // Game animation loop. The interval sets that animation frame rate in ms.
    intervalID = setInterval(()=>game.run(), 10);
}

function stopGame() {
    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);
}
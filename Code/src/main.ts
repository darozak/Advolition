var intervalID = 0;
var robotCount = 4;

var robotCodes: string[] = [];
for(var i = 0; i < robotCount; i ++) robotCodes.push('Empty');

function loadFile(robotNumber: number) {
    const fileSelector = document.querySelector("input[type=file]") as HTMLInputElement;

    const [file] = [fileSelector!.files];

    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      () => {
        robotCodes[robotNumber] = reader.result as string;
      },
      false,
    );
  
    if (file) {
      reader.readAsText(file[0]);
    }
  }
  
function runGame() {

    const game = new Game(new GaiaData()); 

    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);

    // Link to the HTML text area that contains the robot code.
    const robotCode = document.querySelector(".robotCode") as HTMLParagraphElement;

    // Evaluate the robotCodes to create a new program object.
    for(var i = 0; i < robotCodes.length; i ++) {   
      if(robotCodes[i] != 'Empty') {
        game.addRobot(eval(robotCodes[0]) as Program, `Robot ${i + 1}`, true); 
      } else {
        game.addRobot(new Target(), `Robot ${i + 1}`, false);
      } 
    }

    // Game animation loop. The interval sets that animation frame rate in ms.
    intervalID = setInterval(()=>game.run(), 100);
}

function stopGame() {
    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);
}
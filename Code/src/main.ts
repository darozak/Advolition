var intervalID = 0;

/**
 * This function loads a local file into the the robotCode HTML element for
 * use by the runGame() function.
 */
function loadFile() {
    const robotCode = document.querySelector(".robotCode") as HTMLParagraphElement;
    const fileSelector = document.querySelector("input[type=file]") as HTMLInputElement;

    const [file] = [fileSelector!.files];

    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      () => {
        robotCode.innerText = reader.result as string;
      },
      false,
    );
  
    if (file) {
      reader.readAsText(file[0]);
    }
  }
  
/**
 * This function is called from from the HTML button to start the game
 * after the robot code has been loaded into the HTML text area.
 */
function runGame() {

    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);

    // Link to the HTML text area that contains the robot code.
    const robotCode = document.querySelector(".robotCode") as HTMLParagraphElement;

    // Import the text area content into a string.
    if(robotCode) {
        const inputValue: string = robotCode.innerText;
    }

    // Evaluate the string to create a new program object.
    var importedCode = eval(robotCode.innerText) as Program;    
    const game = new Game(new GaiaData());

    // Load robots, inlcuding the program object that was created from the HTML text area.
    game.addRobot(importedCode, "Alpha");
    game.addRobot(new Target(), "Target");
    // game.addRobot(new Tobor(), "Delta");
    // game.addRobot(new Tobor(), "Gamma");

    // Game animation loop. The interval sets that animation frame rate in ms.
    intervalID = setInterval(()=>game.run(), 100);
}

/**
 * This function is invoked by the HTML stop botton to stop the game.
 */
function stopGame() {
    // Stop the interval if a program is already running.
    if(intervalID > 0) clearInterval(intervalID);
}
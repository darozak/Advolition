# Advolition
## Overview
Advolition is a roguelike adventure game in which 1-4 players program robots that compete to explore a randomly generated dungeon and collect items that increase their power and wealth.

The robots are programmed by creating and uploading JavaScript classes that the game engine uses to determine how each of the machines responds to its environment.

The only factors that distinguish one robot from one another are their programs and the items that they find and equip in the dungeon. These items affect the robots' abilities and add their overall scores. The robot with the highest score at the end of the game wins.

I'm creating the game to help teach students how to program in object oriented programming languages like JavaScript.

You can play the most recent version of the game at https://darozak.github.io/Advolition/

## Programming your robot
Players program their robots by creating JavaScript classes that tell the robots how to respond to their environments. Every program must have a class definition that extends the Program class, a run function that accepts a scan data object its an argument and returns an action object, and an object declaration that establishes and unnamed instance of the class.

At a minimum, your JavaScript code must have the following elements structure to work in the game:
```javascript
class MyProgram extends Program {
    run(myData) {
        var myAction = new Action();
        return myAction;
    }
}
new Target();
```
The run function must accept an object that contains the most current information about your robot and its environment. It must also return an extension of the Action class that dictates the robot's next action.

A robot can only perform one action at a time. Different actions take different amounts of time to complete. Whenever an action is complete, the game engine will execute the robot's run function and pass it the most current information about its environment via the myData object.

Therefore, the player must design a run function to analyze the robot's current situation and request a new action from the game engine.



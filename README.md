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

## Action Classes
Advolition has a number of pre-defined Action class extensions that the robot can return from its run function to describe it's next move. These classes are as follows:

### Attack(target: Vector)
The Attack class is used to create an object that instructs the Game Engine to attack a robot at the target Vector using all of its equipped weapons.

### Drop(item: string)
The Drop class creates an object that tells the Game Engine to drop the named item from the robot's inventory.

### Equip(item: string)
The Equip class creates a JavaScript object that tells the the Game Engine to equip the specified item from the robot's inventory.

### Move(target: Vector)
The move class can be used to create a JavaScript object that tells the game engine to move the robot to the adjacent tile that is closest to the target vector.

### Scan()
The Scan class creates an object that instructs the robot to scan its surroundings using any equipped scanners.

### Say(message: string)
The Say class produces an object that causes the Game Engine to post the indicated message to the event log that is displayed to the players.

### Take(item: string)
The Take class allows the player to create an object that announces the robot's intention to pick up an item from the ground.

### Unequip(item: string)
The Unequip class is used to create an object that tells the Game Engine to unequip the named object.

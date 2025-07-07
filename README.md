# Advolition
## Overview
Advolition is a roguelike adventure game in which 1-4 players program robots that compete to explore a randomly generated dungeon and collect items that increase their power and wealth.

The robots are programmed by creating and uploading JavaScript classes that the game engine uses to determine how each of the machines responds to its environment.

The only factors that distinguish one robot from another are their programs and the items that they find and equip in the dungeon. These items affect the robots' abilities and add to their overall wealth. The robot with the highest wealth at the end of the game wins.

You can play the most recent version of the game at https://darozak.github.io/Advolition/

# Exploring the dungeon
The randomly-generated dungeons are laid out in a grid. Robots use scanners to map the dungeon and locate items.

Each dungeon grid is comprised of a single tile, which prermits or restricts movement.  

Some tiles, such as doors, do not restrict movement but they do prevent robots from scanning or attacking through them.

Depending on the tile type, a grid space can contain a single robot and any number of items.

The items a player robots are randomly distributed throughout the dungeon at the begining of the game.

# Collecting items
A robot can carry up to eight items and equip up to four of the items that it's carrying.

A robot's traits equal the sum of the corresponding traits for all the items that the robot has equipped.

The robot's worth is equal to the total worth of all the items that it's carying.

(To Do) The more items that a robot is carrying the longer it will take that robot perform an action.

## Fighting other robots
(To Do) Robots cause different amounts of thermal, kinetic, and/or radiation damage when they attack another robot. The ammount of damage they inflict in each of these categories is the sum of the damage attributes for the items that they're carrying.

(To Do) Robots can also block a certain amount of thermal, kinetic, and/or radiation damage inflected on them by another robot. The ammount of damage they block in each category is the sum of the defense attributes for the items that they're carrying.

(To Do) A robot can sustain up to 50 points of unblocked damage before it's killed and removed from the game. When a robot is removed from the game, it drops all its items in the grid space where it died.

# Winning the Game
(To Do) An exit tile is located someplace in the dungeon. When a robot enters an exit tile it will it will automiticallt exit dungeon and be out of the game.  The robot which has the highest worth when it leaves the dungeon wins the game.

## Programming your robot
Players program their robots by creating JavaScript classes that tell the robots how to respond to their environments. Every program must have a class definition that extends the Program class, a run function that accepts a scan data object its an argument and returns an action object, and an object declaration that establishes and unnamed instance of the class.

Here is an example of the most basic "Hello world!" program that your robot can run:
```javascript
class MyProgram extends Program {
    run(myData) {
        var myAction = new Say('Hello world!');
        return myAction;
    }
}
new MyProgram();
```
The run function must accept an object that contains the most current information about your robot and its environment. It must also return an extension of the Action class that dictates the robot's next action.

A robot can only perform one action at a time. Different actions take different amounts of time to complete. Whenever an action is complete, the game engine will execute the robot's run function and pass it the most current information about its environment via the myData object.

Therefore, the player must design a run function to analyze the robot's current situation and request a new action from the game engine.

## myData
Everthing that a robot needs to know about its environment is contained in the myData data set that is passed to the robot via the `run` method. 

### ScanData Class

| Variable | Type | Description |
| -------- | ---- | ----------- |
| gameTime | number | The current game time, which counts down to zero. |
| itemMap[x][y][n] | Item | A 3D array that can contain any number (n) of items located at the x, y coordinate. |
| mapSize | Vector | A vector that holds the maximum x, y coordinate of the game map. |
| myID     | number | The robot's ID, which can be used to access data about itself drom the robots array. |
| robotMap[x][y] | number | A 2D array that contains the ID of the robot located at that position. A negative value indicates that no robot is present at that location. |
| robots[n] | RobotData | The data on a specific robot (n). |
| scanTime[x][y] | number | The last time at which your robot scanned position x, y.  Any robot or item data asociated with that location will be current as of that point in time. A negative value indicates that this position has not yet been scanned by the robot. |
| tileMap[x][y] | number | The numeric ID of the tile at position x, y.  A negative value indicates that the this position has not yet been scaned by the robot. |
| tiles[n] | Tile | Information on tile type n. |

### Item Class
The item class is used to describe to properties and status of all in-game items.

| Variable | Type | Description |
| -------- | ---- | ----------- |
| effects | Stat | The effect the item has on each of the robot's stats when equipped. |
| isEquipped | boolean | True if the item is equipped. |
| name | string | The name of the item. |
| timeToEquip | number | This is the time required to equip an item for use. |

## Attributes Class
Both robots and items have attributes.  Generally, a robot's attributes sum all the attributes of it's equipped items.

| Variable | Type | Description |
| -------- | ---- | ----------- |
| credits | number | The total value of the robot or item.  The robot with the greatest value at the end of the game wins. |
| HPs | number | The total amount of hitpoints posessed by a robot or provided by an intem. |
| moveCost | number | The total power cost of a move action. |
| moveTime | number | The amount of time it takes for a robot to complete a move action. |



## Action Classes
Advolition has eight pre-defined Action class extensions that the robot can use to describe it's next move. These classes are as follows:

### Attack(target: Vector)
The Attack class is used to create an object that instructs the Game Engine to attack a robot at the target Vector using all of its equipped weapons.

### Drop(item: string)
The Drop class creates an object that tells the Game Engine to drop the named item from the robot's inventory.

### Equip(item: string)
The Equip class creates a JavaScript object that tells the the Game Engine to equip the specified item from the robot's inventory.

### Move(target: Vector)
The move class can be used to create a JavaScript object that tells the game engine to move the robot to the adjacent tile that is closest to the target vector.

### Say(message: string)
The Say class produces an object that causes the Game Engine to post the indicated message to the event log that is displayed to the players.

### Scan()
The Scan class creates an object that instructs the robot to scan its surroundings using any equipped scanners.

### Take(item: string)
The Take class allows the player to create an object that announces the robot's intention to pick up an item from the ground.

### Unequip(item: string)
The Unequip class is used to create an object that tells the Game Engine to unequip the named object.

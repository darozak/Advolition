# Advolition
- This is a great game!
- Program robots to explore a maze, kill monsters, and collect loot.
- Robots are programmed in C++ or a comparable object oriented language.
- The entire game is contained in a single class, which generates a maze, moves monsters, and accepts commands to move the player's robot.
- Every time an object is created, the class uses a seed to generate the maze and all it's contents.  This seed can be used to repeatedly play the same dungeon or compete with others to explore the same dungeon in a tournament.
- Robots can collect gold, power, and equipment along the way which will contribute to their overall score.
- In lightning rounds the robot can enter the same dungeon multiple times to generate and everage success score.
- A machine learning algorythm can be used to optimize the robot's performance.
- The player needs to create code for the robot to interpret, store, and respond to its environment.
- While running, the application can report results back to the player and accept player commands.  However, this direct interaction won't be available in tournament mode.
- The sim advances every time a robot calls an Advolition class function.
- Tournament winners are determined by the score that they return with.
- If I use a web-based language like JavaScript, players can eventually write programs that interact with one another and a larger world via an online database.
- When the game is over the player's code can continue running to report back the results or try another round in the dungeon.  However, the Advolition class will prvent the killed robot from going any further until the dungeon is reset.
- With the current design, there may not be any need to keep the Advolition script secret.  This is because tournament robots will always run against the online version of the code using a randomly assigned seed.
- Robots must return to the entrance to be fully repaired. This will result in a time penalty.

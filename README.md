# Advolition

You can play the most recent version of the game here: https://darozak.github.io/Advolition/

## Game Objectives
Here are my goals for making this game:
- [Done] An open source game that is free to play.
- [Done] A perpetually maintained platform such as GitHub.
- A digitally produced book that describes how to use the game to teach coding.
- A fun way to learn JavaScript
- A tournament mode to rate and rank robot performance.
  - Lighning rounds to generate average score over multiple entries.
- [Done] Players compete against one another or default robots to win.

## Development Tasks
These are the things that I need to accomplish to consider this a complete game:

- Major equipment classes
    - [Done] Batteries
    - [Done] Scanners
    - [Done] Shields
    - [Done] Cores
    - [Done] Weapons
    - Ammunition
    - [Done] Armor
    - Power generators
    - Digital keys
- [Done] Equipment management
    - [Done] Figure out how to manage multiple iteams in one tile.
    - [Done] Allow robots to identify equiment in a scan.
    - [Done] Have a basic inventory management system that allows robots to take, equip, and drop equipment.
- Combat mechanism
    - [Done] Add attack option.
    - Remove dead robots from game and event log.
    - Dead robots drop equipment.
- Generate and populate dungeons using random seeds.
    - [Done] Scatter equipment throughout the dungeon.  
    - [Done] Place robots in random lications.
- Score robots based on their performance in the dungeon.
    - [Done] Collecting treasures.
    - Killing NPRs.
    - Returning quickly.
- Starting the game
    - [Done] Allow players to load and run a JS file from their own computer.
    - Allow players to select a playthrough rate
    - Have a lighning mode in which robots are rapidly run through a dungeon multiple times to generate an average score.
    - Include start and stop screens.
- Documentation
    - Create easy to access instructions and demo robots. Publish on Amazon.

## Follow-on Tasks
These are some things I can do to improve the gameplay experience after first developing a simple version of the game.
- Allow players to post successful robots and their scores.

## Game Sketch
These are general ideas that I have brainstormed for gameplay.
- Players program robots to explore a dungeon, kill monsters, and collect loot.
- Going down a level increases complexity and challenge.
- Robots are programmed in JavaScript.
- The game uses a random seed to generate the maze and all it's contents.  This seed can be used to repeatedly play the same dungeon or compete with others to explore the same dungeon in a tournament.
- Robots can collect gold, power, and equipment along the way which will contribute to their overall score.
- In lightning rounds the robot can enter the same dungeon multiple times to generate and everage success score.
- A machine learning algorythm can be used to optimize the robot's performance.
- The player needs to create code for the robot to interpret, store, and respond to its environment.
- Tournament winners are determined by the score that they return with.
- Players can write programs that interact with one another in the same dungeon.
- Successful player robots (PRs) can eventually be added to the game as non-player robots (NPRs).
- With the current design, there may not be any need to keep the Advolition script secret.  This is because tournament robots will always run against the online version of the code using a randomly assigned seed.
- Robots must return to the entrance to be fully repaired. This will result in a time penalty.  Have repair stations near the entrance.

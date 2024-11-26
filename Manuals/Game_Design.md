# Advolition Game Design Manual

# Navigating the Dungeon
Dungeons are laid out in a grid. 

Each grid space is comprised of a single tile, which prermits or restricts movement.  

Some tiles, such as doors, do not restrict movement but they do prevent robots from scanning or attacking through them.

Depending on the tile type, a grid space can contain a single robot and any number of items.

# Managing Traits
Both robots and items share the same set of traits. Generally speaking, a robot's traits equal the sum of the corresponding traits for all the items that the robot is carrying.

(To Do) A robot can cary up to four items.

## Bulk
(To Do) Every item has a bulk associated with it. This represents how combersome it is to carry and use the item. The robot's bulk is the sum of bulks for the items that it's carying.

(To Do) This cumulative bulk affects the time it takes a robot to complete different actions. For example, the more bulk that a robot is carying, the longer it will take the robot to move, attack, and scan.

## Thermal, Kinetic, and Radation Damage
(To Do) Robots cause different amounts of thermal, kinetic, and/or radiation damage when they attack another robot. 

The ammount of damage they inflict in each of these categories is the sum of the damage attributes for the items that they're carrying.

(To Do) A robot can sustain up to 50 points of damage before it is killed and removed from the game.  

When a robot is removed from the game, it drops all its items in the grid space where it died.

## Thermal, Kinetic, and Radiation Defense
(To Do) Robots can also block or dissopate a certain amount of thermal, kinetic, and/or radiation damage inflected on them by another robot. 

The ammount of damage they block in each category is the sum of the defense attributes for the items that they're carrying.

## Worth
(To Do) Each item has a worth associated with it. The robot's worth is the sum of all the objects that it's carrying. 

(To Do) At the end of the game the worth of all items on a robots base tile (to include the robot itself) are summed and the player with the most accumulated worth wins the game.

# Winning the Game
(To Do) Each robot starts the game on their home tile.

(To Do) Robots must ammas as much worth in their home tiles as they can before the timer runs down to zero.  When the timer reaches zero, the robot with the most accumulated worth on its home tile will win, regardless of whether the robot has been killed.
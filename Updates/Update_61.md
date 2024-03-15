# Script for Update 61
My name is Dave and I'm working on a series of robotic challenges to teach students how to code.

Advolition is one of these challenges.  In Advolition, players use JavaScript to code robots that battle each other in a Roguelike dungeon.

The current version of the game relies on a simple hand-drawn ascii sketch to render the areanas.  I did this mainly for testing components.

Now I'm ready to implement a random dungeon generator that is capable of creating more complex dungeons like those used in traditional roguelike games.

Fortunately, ??? has already created a full set of opensource roguelike develeper tools at ROT.js. Among these tools is a dungeon generator routine that lays out rooms and corridors in a defined space.

All the ROT.js routines are well documented and it didn't take long to integrate them into the Advolition script.

After tweaking the code to meet my needs, I have a system that will place up to four player robots in a randomly generated arena of any size!

My next step will be to code an algorythm for randomly distributing items throughout the dungeon.  The player and non-player robots will be able to use these items to increase specific traits that will help them prevevail in combat.

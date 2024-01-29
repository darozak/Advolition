
console.log("This is main!");
var worldSize = new Vector(5,5);
const robot = new Robot(gaia, worldSize);
console.log(robot.stats);
robot.move(0);
robot.move(0);
robot.move(0);
robot.wait(3);
console.log(robot.stats);
// robot.wait(3);
// console.log(robot.status);
// robot.move(0);
// console.log(robot.status);

console.log("This is main!");
const robot = new Robot(gaia);
console.log(robot.stats);
robot.move(0);
robot.move(0);
robot.move(0);
robot.wait(3);
robot.wait(robot.scan());
console.log(robot.stats);

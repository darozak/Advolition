"use strict";
/**
 * This is the class that is used by the user's program to receive information
 * about the environment and direct the robot's in-game actions.
 */
class Robot {
    #world;
    #stats;
    #engine;
    /**
     * Use the constructor to create an instance of this class in your code that
     * you can call upon to direct your robot through the dungen and learn about
     * it's surroindings.
     *
     * @param world Pass the data structure to the robot that defines what it's word
     * will look like.
     */
    constructor(world, worldSize) {
        this.#world = world;
        this.#stats = new Hero(worldSize);
        this.#engine = new Engine(world, this.#stats);
    }
    /**
     * The robot will wait a number of seconds in game time.
     * This will allow scheduled actions to occur.
     *
     * @param time An amount of time in seconds.
     */
    wait(time) {
        this.#engine.wait(time);
    }
    /**
     * Submits a request for the robot to move in the indicated direction.
     *
     * @param direction This is an integer value from 0 to 7 that represents the eight
     * points of the compus starting at north (0) and progressing in a clockwise direction
     * around the compass rose.
     *
     * @return Returns the time in seconds that it will take the robot to complete this action.
     * Will return a zero if the robot is currently unable to move.
     */
    move(direction) {
        let duration = 0;
        if (!this.#engine.status.isMoving) {
            duration = 4;
            this.#engine.addAction("move", direction, duration);
            this.#engine.status.isMoving = true;
        }
        return duration;
    }
    /**
     * Retreives the robot's current stats in a data structure.
     */
    get stats() {
        return structuredClone(this.#stats);
    }
}

"use strict";
/**
 * Creates an object to track the transition from one array to another over a number
 * of animation frames.
 */
class RampedArray {
    currentFrame = 0;
    lastFrame;
    firstArray;
    secondArray;
    isRampingUp = true;
    /**
     * Creats an object to track the transition from one array to another over a number
     * of animation frames.
     * @param firstArray The starting array.
     * @param secondArray The ending array.
     * @param frameCount The number of animation frames over which the first array will
     * transform into the second array.
     */
    constructor(firstArray, secondArray, frameCount) {
        this.firstArray = firstArray;
        this.secondArray = secondArray;
        this.lastFrame = frameCount;
        // Equalize lengths of arrays.
        while (this.firstArray.length < this.secondArray.length)
            this.firstArray.push(0);
        while (this.secondArray.length < this.firstArray.length)
            this.secondArray.push(0);
    }
    /**
     * Tells the object to start a transition from the first array up to the second array.
     */
    rampUp() {
        this.isRampingUp = true;
        this.currentFrame = 0;
    }
    /**
     * Tells the object to start a transition from the second array down to the first array.
     */
    rampDown() {
        this.isRampingUp = false;
        this.currentFrame = 0;
    }
    /**
     * Returns the current value of the array in the animation sequence.
     * @returns The current value of the array in the animation sequence.
     */
    currentValue() {
        var output = [];
        this.currentFrame++;
        // Hold on last frame.
        if (this.currentFrame > this.lastFrame)
            this.currentFrame = this.lastFrame;
        // Smoothly transition between the two arrays.
        if (this.isRampingUp) {
            for (var i = 0; i < this.firstArray.length; i++) {
                output[i] = this.firstArray[i] + Math.round((this.secondArray[i] - this.firstArray[i]) * this.currentFrame / this.lastFrame);
            }
        }
        else {
            for (var i = 0; i < this.firstArray.length; i++) {
                output[i] = this.secondArray[i] + Math.round((this.firstArray[i] - this.secondArray[i]) * this.currentFrame / this.lastFrame);
            }
        }
        return output;
    }
}

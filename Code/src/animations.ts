/**
 * Creates an object to track the transition from one array to another over a number
 * of animation frames.
 */
class RampedArray {
    currentFrame: number;
    pulsePattern: number[] = [];
    endPoint: number[] = [];

    restingArray: number[];
    activatedArray: number[];    
    hold: boolean = false;

    /**
     * Creats an object to track the transition from one array to another over a number
     * of animation frames.
     * @param restingArray The array when in a resting state.
     * @param activatedArray The array when in an acivated state.
     * @param pulsePattern A three number array that indicates the number of frames that
     * are spent ramping up to the activated array, holding there, and then ramping down
     * to the resting array.
     */
    constructor(restingArray: number[], activatedArray: number[], pulsePattern: number[]) {
        this.restingArray = restingArray;
        this.activatedArray = activatedArray;

        this.pulsePattern = pulsePattern;
        while(this.pulsePattern.length < 3) this.pulsePattern.push(0);

        this.endPoint[0] = this.pulsePattern[0];
        this.endPoint[1] = this.endPoint[0] + this.pulsePattern[1];
        this.endPoint[2] = this.endPoint[1] + this.pulsePattern[2];

        this.currentFrame = this.endPoint[2];

        // Equalize lengths of arrays.
        while (this.restingArray.length < this.activatedArray.length) this.restingArray.push(0);
        while (this.activatedArray.length < this.restingArray.length) this.activatedArray.push(0);
    }

    /**
     * Tells the object to start a transition from the resting array up to the activated array.
     */
    activate() {
        this.hold = true;
        this.currentFrame = 0;
    }

    /**
     * Tells the object to start a transition from the activated array down to the resting array.
     */
    deactivate() {
        this.hold = false;
    }

    /**
     * Tells the object to transition to an activated state and back without pausing.
     */
    pulse() {
        this.hold = false;
        this.currentFrame = 0;
    }

    /**
     * Returns the current value of the array in the animation sequence.
     * @returns The current value of the array in the animation sequence.
     */
    value() {
        var output: number[] = [];
        this.currentFrame ++;

        // Smoothly transition between the two arrays.
        if(this.currentFrame < this.endPoint[0]) {
            for(var i = 0; i < this.restingArray.length; i++) {
                output[i] = this.restingArray[i] + Math.round((this.activatedArray[i]-this.restingArray[i]) * this.currentFrame / this.endPoint[0]);
            }
        } else if(this.currentFrame < this.endPoint[1]) {
            output = this.activatedArray;
            if(this.hold) this.currentFrame = this.endPoint[1] - 1;
        } else if(this.currentFrame < this.endPoint[2]) {
            for(var i = 0; i < this.restingArray.length; i++) {
                output[i] = this.activatedArray[i] + Math.round((this.restingArray[i]-this.activatedArray[i]) * (this.currentFrame - this.endPoint[1]) / this.endPoint[2]);
            }
        } else {
            output = this.restingArray;
        }
        return output;
    } 
}


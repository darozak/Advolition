"use strict";
/**
 * A super class for animated objects that holds the methods required to transform
 * or cycle between arrays of values each time an object created from one of the
 * subclasses is called.
 */
class AnimatedObject {
    frame = 0;
    paper;
    constructor(paper) {
        this.paper = paper;
    }
    rampBetween(initial, final, currentFrame, lastFrame) {
        // Equalize lengths of arrays.
        while (initial.length < final.length)
            initial.push(0);
        while (final.length < initial.length)
            final.push(0);
        // Hold on last frame.
        if (currentFrame > lastFrame)
            currentFrame = lastFrame;
        // Smoothly transition between the two arrays.
        var output = [];
        for (var i = 0; i < initial.length; i++) {
            output[i] = initial[i] + Math.round((final[i] - initial[i]) * currentFrame / lastFrame);
        }
        return output;
    }
}
/**
 * Creates an animated list item that can be activated and deactivate it.  When activated
 * it will change to to a new color.  When deactivated it will switch back.
 */
class AnimatedListItem extends AnimatedObject {
    isActive = false;
    /**
     * Activates the list item, causing it to change to blue.
     */
    activate() {
        this.frame = 0;
        this.isActive = true;
    }
    /**
     * Deactivates the list item, causing it to return to a soft gray.
     */
    deactivate() {
        this.frame = 0;
        this.isActive = false;
    }
    /**
     * Renders the animated text object at the indicated location.
     * @param text The rendered text.
     * @param centerFrame The center of the text.
     * @param topFrame The top of the text.
     */
    render(text, centerFrame, topFrame) {
        this.frame++;
        var rgbaArray;
        if (this.isActive) {
            rgbaArray = this.rampBetween([80, 80, 80, 100], [51, 110, 156, 100], this.frame, 6);
        }
        else {
            rgbaArray = this.rampBetween([51, 110, 156, 100], [80, 80, 80, 100], this.frame, 6);
        }
        this.paper.drawListItem(centerFrame, topFrame, text, rgbaArray);
    }
}
class AnimatedStat extends AnimatedObject {
    duration = 0;
    label;
    constructor(paper, label) {
        super(paper);
        this.label = label;
    }
    flash(duration) {
        this.frame = 0;
        this.duration = duration;
    }
    render(value, centerFrame, topFrame) {
        this.frame++;
        var rgbArray;
        rgbArray = this.rampBetween([180, 180, 180], [51, 110, 156], this.frame, this.duration);
        this.paper.showStatus(centerFrame, topFrame, this.label, value, rgbArray);
    }
}

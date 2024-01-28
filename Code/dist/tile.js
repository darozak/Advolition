"use strict";
class Tile {
    feature;
    lit;
    unseen;
    constructor(feature) {
        this.feature = feature;
        this.lit = false;
        this.unseen = false;
    }
}

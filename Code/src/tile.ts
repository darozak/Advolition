class Tile {
    feature: number;
    lit: boolean;
    unseen: boolean;

    constructor(feature: number) {
        this.feature = feature;
        this.lit = false;
        this.unseen = false;
    }
}
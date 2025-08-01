import { Entity } from "./Entity.js";
import { Bounds } from "./components/Bounds.js";

export class FrozenClone extends Entity {
    constructor(x, y, width, height) {
        // Call parent constructor
        super(x, y, width, height);
        this.size = 64; // THIS IS QUITE MESSY, CLONES SHOULD JUST SHARE SOME PROPERTIES WITH PLAYER
        this.bounds = new Bounds(this.size - 24, this.size - 12, 12, 12); 
        
        // FrozenClone-specific properties
    }

    /**
     * FrozenClones don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }
}
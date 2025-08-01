import { Entity } from "./Entity.js";

export class Platform extends Entity {
    constructor(x, y, width, height) {
        // Call parent constructor
        super(x, y, width, height);
        
        // Platform-specific properties
    }

    /**
     * Platforms don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }
}
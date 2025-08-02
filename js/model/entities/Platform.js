import { Entity } from "./Entity.js";

export class Platform extends Entity {
    constructor(x, y, width, height, collisionType, requiredCoins = null) {
        // Call parent constructor
        super(x, y, width, height, collisionType);

        // Platform-specific properties
        this.requiredCoins = requiredCoins; // For numbered platforms
    }

    /**
     * Platforms don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }


}
import { Entity } from "./Entity.js";

export class Coin extends Entity {
    constructor(x, y) {
        const size = 64; // Default size for coins
        // Call parent constructor with size for both width and height
        super(x, y, size, size);
        
        // Coin-specific properties
        this.size = size; // Keep size property for backward compatibility

        // Enable animation for coins with 3 frames (0-2)
        this.setAnimationEnabled(true, 3);
        
    }

    /**
     * Get coin size (override for backward compatibility)
     * @returns {number} Coin size
     */
    getSize() {
        return this.size;
    }
}
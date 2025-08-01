import { Entity } from "./Entity.js";
import { Bounds } from "./components/Bounds.js";
export class Coin extends Entity {
    constructor(x, y) {
        const size = 64; // Default size for coins
        // Call parent constructor with size for both width and height
        super(x, y, size, size);
        
        // Coin-specific properties
        this.size = size; // Keep size property for backward compatibility
        this.bounds = new Bounds(this.size - 8, this.size - 8, 4, 4); 

        // Enable animation for coins with 2 frames (0-1)
        this.setAnimationEnabled(true, 2);
        
    }

    /**
     * Get coin size (override for backward compatibility)
     * @returns {number} Coin size
     */
    getSize() {
        return this.size;
    }
}
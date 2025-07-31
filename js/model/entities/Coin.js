import { Entity } from "./Entity.js";

export class Coin extends Entity {
    constructor(x, y, size = 20) {
        // Call parent constructor with size for both width and height
        super(x, y, size, size);
        
        // Coin-specific properties
        this.size = size; // Keep size property for backward compatibility
    }

    /**
     * Get coin size (override for backward compatibility)
     * @returns {number} Coin size
     */
    getSize() {
        return this.size;
    }
}
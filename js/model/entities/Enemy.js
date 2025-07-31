import { Entity } from "./Entity.js";

export class Enemy extends Entity {
    constructor(x, y, size = 20) {
        // Call parent constructor with size for both width and height
        super(x, y, size, size);
        
        // Enemy-specific properties
        this.size = size; // Keep size property for backward compatibility
    }

    /**
     * Get enemy size (override for backward compatibility)
     * @returns {number} Enemy size
     */
    getSize() {
        return this.size;
    }
}
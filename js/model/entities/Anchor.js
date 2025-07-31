import { Entity } from "./Entity.js";

export class Anchor extends Entity {
    constructor(x, y, width = 20, height = 20) {
        // Call parent constructor
        super(x, y, width, height);
        
        // Anchor-specific properties
        this.isStatic = true; // Mark as static entity
        this.isAnchor = true; // Special flag to identify anchors
        this.color = { r: 128, g: 128, b: 128 }; // Grey color
    }

    /**
     * Anchors don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }

    /**
     * Get anchor color
     * @returns {Object} Color object with r, g, b values
     */
    getColor() {
        return this.color;
    }
}

import { Bounds } from "./components/Bounds.js";

/**
 * Base Entity class - provides unified interface for all game entities
 */
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Initialize bounds with entity dimensions
        this.bounds = new Bounds(width, height, 0, 0);
        
        // Common entity properties
        this.isStatic = false; // Whether entity moves or not
    }

    /**
     * Get entity position
     * @returns {Object} Position object with x, y coordinates
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Set entity position
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Get entity bounds/dimensions
     * @returns {Object} Bounds object with x, y, width, height
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get entity size (for square entities, returns width/height)
     * @returns {Object} Size object with width and height
     */
    getSize() {
        return {
            width: this.width,
            height: this.height
        };
    }

    /**
     * Update entity state - override in subclasses
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
        // Base implementation does nothing
        // Override in subclasses that need to update
    }
}

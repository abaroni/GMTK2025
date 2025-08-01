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
        this.boundsEnabled = true; // Enable bounds by default
        
        // Animation properties
        this.animationFrame = 0; // Current animation frame (0-3)
        this.animationTimer = 0; // Timer for animation
        this.animationSpeed = 0.15; // Seconds per frame (configurable)
        this.maxAnimationFrames = 3; // Maximum number of animation frames (0-2)
        this.animationEnabled = false; // Whether this entity should animate
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
        // Update animation if enabled
        if (this.animationEnabled) {
            this.updateAnimation(deltaTime);
        }
        
        // Base implementation does nothing else
        // Override in subclasses that need additional update logic
    }

    /**
     * Update animation frame based on timer
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Check if it's time to advance to next frame
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % this.maxAnimationFrames;
            this.animationTimer = 0; // Reset timer
        }
    }

    /**
     * Set animation speed
     * @param {number} speed - Seconds per frame
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }

    /**
     * Get current animation frame
     * @returns {number} Current frame
     */
    getAnimationFrame() {
        return this.animationFrame;
    }

    /**
     * Enable or disable animation for this entity
     * @param {boolean} enabled - Whether animation should be enabled
     * @param {number} maxFrames - Maximum number of animation frames (optional)
     */
    setAnimationEnabled(enabled, maxFrames = 3) {
        this.animationEnabled = enabled;
        if (maxFrames) {
            this.maxAnimationFrames = maxFrames;
        }
    }
}

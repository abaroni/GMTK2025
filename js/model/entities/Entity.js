import { Bounds } from "./components/Bounds.js";

/**
 * Base Entity class - provides unified interface for all game entities
 */
export class Entity {
    constructor(x, y, width, height, collisionType = 'solid') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        
        // Initialize bounds with entity dimensions
        this.bounds = new Bounds(width, height, 0, 0);
        this.boundsEnabled = true; // Enable bounds by default
        this.collisionType = collisionType;
        
        // Animation properties
        this.animationFrame = 0; // Current animation frame (0-3)
        this.animationTimer = 0; // Timer for animation
        this.animationSpeed = 0.15; // Seconds per frame (configurable)
        this.maxAnimationFrames = 3; // Maximum number of animation frames (0-2)
        this.animationEnabled = false; // Whether this entity should animate
        this.animationLoopCallback = null; // Callback when animation loops (optional)
        
        // Custom animation properties
        this.customAnimation = null; // Current custom animation object
        this.isPlayingCustomAnimation = false; // Whether a custom animation is playing
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
        // Update custom animation if playing (takes priority over regular animation)
        if (this.isPlayingCustomAnimation && this.customAnimation) {
            this.updateCustomAnimation(deltaTime);
        } else if (this.animationEnabled) {
            // Update regular animation if no custom animation is playing
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
            // If we reached the last frame, call loop callback if set
            if (this.animationFrame === 0 && this.animationLoopCallback) {
                this.animationLoopCallback();
            }
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

    /**
     * Play a custom animation with a callback when finished
     * @param {Object} animationConfig - Animation configuration
     * @param {number} animationConfig.frameCount - Number of frames in the animation
     * @param {number} animationConfig.frameSpeed - Seconds per frame
     * @param {number} animationConfig.startFrame - Starting frame (default: 0)
     * @param {boolean} animationConfig.loop - Whether to loop the animation (default: false)
     * @param {Function} animationConfig.onComplete - Callback when animation completes
     */
    playCustomAnimation(animationConfig) {
        const config = {
            frameCount: 3,
            frameSpeed: 0.1,
            startFrame: 0,
            loop: false,
            onComplete: null,
            ...animationConfig
        };

        this.customAnimation = {
            frameCount: config.frameCount,
            frameSpeed: config.frameSpeed,
            startFrame: config.startFrame,
            loop: config.loop,
            onComplete: config.onComplete,
            currentFrame: config.startFrame,
            timer: 0,
            hasCompleted: false
        };

        this.isPlayingCustomAnimation = true;
        this.animationFrame = config.startFrame; // Set initial frame
    }

    /**
     * Update custom animation frame based on timer
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    updateCustomAnimation(deltaTime) {
        if (!this.customAnimation) return;

        this.customAnimation.timer += deltaTime;

        // Check if it's time to advance to next frame
        if (this.customAnimation.timer >= this.customAnimation.frameSpeed) {
            this.customAnimation.currentFrame++;
            this.customAnimation.timer = 0; // Reset timer

            // Check if animation has completed
            if (this.customAnimation.currentFrame >= this.customAnimation.startFrame + this.customAnimation.frameCount) {
                if (this.customAnimation.loop) {
                    // Loop back to start frame
                    this.customAnimation.currentFrame = this.customAnimation.startFrame;
                } else {
                    // Animation completed
                    this.customAnimation.hasCompleted = true;
                    this.isPlayingCustomAnimation = false;
                    
                    // Call completion callback if provided
                    if (this.customAnimation.onComplete && typeof this.customAnimation.onComplete === 'function') {
                        this.customAnimation.onComplete();
                    }
                    
                    // Clear custom animation
                    this.customAnimation = null;
                    return;
                }
            }

            // Update the entity's animation frame
            this.animationFrame = this.customAnimation.currentFrame;
        }
    }

    /**
     * Stop any currently playing custom animation
     */
    stopCustomAnimation() {
        if (this.isPlayingCustomAnimation) {
            this.isPlayingCustomAnimation = false;
            this.customAnimation = null;
        }
    }

    /**
     * Check if a custom animation is currently playing
     * @returns {boolean} Whether a custom animation is playing
     */
    isCustomAnimationPlaying() {
        return this.isPlayingCustomAnimation;
    }

}

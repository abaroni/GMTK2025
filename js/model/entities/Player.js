import { Entity } from "./Entity.js";
import { Bounds } from "./components/Bounds.js";
import { Physics } from "./components/Physics.js";

export class Player extends Entity {
    constructor() {
        const size = 64;
        // Call parent constructor with initial position and size
        super(450, 450, size, size);
        
        // Player-specific properties
        this.size = size; // Keep size property for backward compatibility
        this.maxSpeed = 500; // Maximum speed in pixels per second
        this.velocity = { x: 0, y: 0 }; // Current velocity
        this.acceleration = 500; // How quickly player reaches max speed
        this.friction = 0.85; // Velocity decay when no input (per frame)
        this.color = { r: 0, g: 255, b: 0 }; // Green color
        this.facingDirection = 'right'; 
        this.isRunning = false;
        
        // Override the default bounds with custom player bounds
        this.bounds = new Bounds(this.size - 24, this.size - 12, 12, 12); // Initialize bounds with player size
        this.physics = new Physics(2000, 400); // Initialize physics component

        this.activeDirections = new Set(); // Store currently pressed directions
        
        // Jump properties
        this.jumpVelocity = -900; // Jump strength (negative = upward)
        
        // Coyote time properties
        this.coyoteTime = 0.1; // 100ms grace period after leaving ground
        this.coyoteTimer = 0; // Current coyote time remaining
        
        // Animation properties
        this.animationFrame = 0; // Current animation frame (0-3)
        this.animationTimer = 0; // Timer for animation
        this.animationSpeed = 0.15; // Seconds per frame (configurable)
        
        // Player is not static (can move)
        this.isStatic = false;
    }

    /**
     * Apply input to velocity (called for each direction being pressed)
     * @param {string} direction - 'up', 'down', 'left', 'right'
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    applyInput(direction, deltaTime) {
        // Track active direction
        this.activeDirections.add(direction);
        
        const accelerationAmount = this.acceleration * deltaTime;
        
        switch (direction) {
            case 'up':
                // Jump if on ground OR within coyote time
                if (this.physics.onGround || this.coyoteTimer > 0) {
                    this.velocity.y = this.jumpVelocity;
                    this.physics.onGround = false; // Player is now airborne
                    this.coyoteTimer = 0; // Use up coyote time
                }
                break;
            case 'down':
                // Down key has no effect in platformer
                break;
            case 'left':
                this.velocity.x -= accelerationAmount;
                this.facingDirection = 'left'; 
                break;
            case 'right':
                this.velocity.x += accelerationAmount;
                this.facingDirection = 'right';
                break;
        }
        
        // Clamp horizontal velocity to max speed (don't limit vertical for gravity/jumps)
        if (Math.abs(this.velocity.x) > this.maxSpeed) {
            this.velocity.x = Math.sign(this.velocity.x) * this.maxSpeed;
        }
    }

    /**
     * Update player position based on velocity
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
        // Store previous ground state for coyote time
        const wasOnGround = this.physics.onGround;
        
        // Reset ground state at start of frame - collision system will set it back to true if still grounded
        this.physics.onGround = false;
        
        // Update coyote timer
        if (wasOnGround && !this.physics.onGround) {
            // Just left ground, start coyote timer
            this.coyoteTimer = this.coyoteTime;
        } else if (!wasOnGround && !this.physics.onGround) {
            // Still in air, decrease coyote timer
            this.coyoteTimer = Math.max(0, this.coyoteTimer - deltaTime);
        } else if (this.physics.onGround) {
            // Back on ground, reset coyote timer
            this.coyoteTimer = 0;
        }
        
        // Check if input directions oppose current velocity (only for horizontal)
        const hasLeft = this.activeDirections.has('left');
        const hasRight = this.activeDirections.has('right');
        if(hasLeft || hasRight) {
            this.isRunning = true;
        } else {
            this.isRunning = false; // No horizontal input means not running
        }

        // Check if horizontal input opposes current velocity direction
        let hasValidHorizontalInput = false;
        if (hasLeft || hasRight) {
            if (hasLeft && hasRight) {
                // Both directions pressed - apply friction
                hasValidHorizontalInput = false;
            } else if (hasLeft && this.velocity.x > 0) {
                // Moving right but pressing left - apply friction for direction change
                hasValidHorizontalInput = false;
            } else if (hasRight && this.velocity.x < 0) {
                // Moving left but pressing right - apply friction for direction change
                hasValidHorizontalInput = false;
            } else {
                // Input aligns with velocity or velocity is zero
                hasValidHorizontalInput = true;
            }
        }
        
        // Apply horizontal friction only if no valid horizontal input
        if (!hasValidHorizontalInput) {
            this.velocity.x *= this.friction;
        }
        
        // Always apply gravity
        this.velocity.y += this.physics.gravity * deltaTime;
        
        // Clear active directions for next frame
        this.activeDirections.clear();
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Calculate intended position
        this.x = this.x + this.velocity.x * deltaTime;
        this.y = this.y + this.velocity.y * deltaTime;
    }

    /**
     * Update animation frame based on timer
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Check if it's time to advance to next frame
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 3; // Cycle through frames 0-2
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
     * @returns {number} Current frame (0-3)
     */
    getAnimationFrame() {
        return this.animationFrame;
    }

    /**
     * Apply a bounce effect (used for collision response)
     * @param {Object} bounceVector - { x, y } vector for bounce direction and strength
     */
    applyBounce(bounceVector) {
        this.velocity.x += bounceVector.x;
        this.velocity.y += bounceVector.y;

        // Clamp to max speed after bounce
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
    }

    /**
     * Get intended position for collision checking
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     * @returns {Object} Intended position { x, y }
     */
    getIntendedPosition(deltaTime) {
        return {
            x: this.x + this.velocity.x * deltaTime,
            y: this.y + this.velocity.y * deltaTime
        };
    }

    /**
     * Set position directly (used for collision resolution)
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Reset player to a new position with clean physics state (used for level resets)
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    resetToPosition(x, y) {
        this.x = x;
        this.y = y;
        
        // Reset velocity and physics state when resetting position
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.physics.onGround = false; // Will be set correctly by collision detection
        this.coyoteTimer = 0; // Reset coyote time
        this.activeDirections.clear(); // Clear any active input directions
        
        console.log(`Player reset to position: (${x}, ${y}), velocity: (${this.velocity.x}, ${this.velocity.y})`);
    }


    /**
     * Get player velocity
     * @returns {Object} Velocity object with x, y components
     */
    getVelocity() {
        return { x: this.velocity.x, y: this.velocity.y };
    }

    /**
     * Get player size (override for backward compatibility)
     * @returns {number} Player size
     */
    getSize() {
        return this.size;
    }

    /**
     * Get player color
     * @returns {Object} Color object with r, g, b values
     */
    getColor() {
        return this.color;
    }

    /**
     * Reset player to initial position and clear velocity
     */
    reset() {
        this.x = 50;
        this.y = 50;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

}

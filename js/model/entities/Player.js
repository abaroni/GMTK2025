import { Entity } from "./Entity.js";
import { Bounds } from "./components/Bounds.js";
import { Physics } from "./components/Physics.js";
import { Utils } from "../../utils.js";

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
        this.frictionX = 0.85; // Horizontal friction when no input
        this.frictionY = 0.98; // Vertical friction (not used in simplified system)
        this.color = { r: 0, g: 255, b: 0 }; // Green color
        this.facingDirection = 'right'; 
        this.isRunning = false;
        this.midJump = true; // Whether player is currently mid-jump
        this.onJump = null;

        // Override the default bounds with custom player bounds
        this.bounds = new Bounds(this.size - 24, this.size - 12, 12, 12); // Initialize bounds with player size
        this.physics = new Physics(2000, 400); // Initialize physics component

        this.activeDirections = new Set(); // Store currently pressed directions
        
        // Simplified jump properties
        this.jumpVelocity = -700; // Base jump strength (negative = upward)
        this.jumpKeyHeld = false; // Whether jump key is currently being held
        this.pastFrameOnGround = true; // Whether player was on ground in the previous frame
        this.jumpGravity = 1500; // Gravity when jumping and key held (much lighter for high jumps)
        this.fallGravity = 3000; // Gravity when falling or key released (much heavier for quick tap)
        this.maxFallSpeed = 800; // Terminal velocity
        
        // Gravity transition properties
        this.gravityTransitionTime = 0.2; // Time in seconds to transition between gravities
        this.gravityTransitionTimer = 0; // Current transition timer
        
        // Coyote time (grace period after leaving ground)
        this.coyoteTime = 0.75;
        this.coyoteTimer = 0;
        
        // Enable animation for player with 3 frames
        this.setAnimationEnabled(true, 3);
        
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
                    if(!this.midJump) {
                        this.onJump?.(); // Call jump callback if set
                    }
                    this.midJump = true; // Mark as mid-jump
                }
                this.jumpKeyHeld = true; // Mark jump key as being held
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
     * Handle jump key release for variable jump height
     * Call this when the jump key (up/space) is released
     */
    onJumpKeyRelease() {
        this.jumpKeyHeld = false;
        // Start gravity transition timer when jump key is released
        this.gravityTransitionTimer = 0;
    }
    /**
     * Update player position based on velocity
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {        
        // Update coyote timer
        if (this.pastFrameOnGround && !this.physics.onGround) {
            // Just left ground, start coyote timer
            this.coyoteTimer = this.coyoteTime;
        } else if (!this.pastFrameOnGround && !this.physics.onGround) {
            // Still in air, decrease coyote timer
            this.coyoteTimer = Math.max(0, this.coyoteTimer - deltaTime);
        } else if (this.physics.onGround) {
            // Back on ground
            this.coyoteTimer = 0;
            this.midJump = false; 
        }
        this.pastFrameOnGround = this.physics.onGround; // Store current ground state for next frame
        // Reset ground state at start of frame - collision system will set it back to true if still grounded
        this.physics.onGround = false;
        
        // Handle horizontal movement and friction
        const hasLeft = this.activeDirections.has('left');
        const hasRight = this.activeDirections.has('right');
        
        if (hasLeft || hasRight) {
            this.isRunning = true;
        } else {
            this.isRunning = false;
        }

        // Check if horizontal input opposes current velocity direction for friction
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
            this.velocity.x *= this.frictionX;
        }
        
        // Apply gravity - use smooth transitions between different gravity values
        let currentGravity;
        if (this.velocity.y < 0) {
            // Moving upward (jumping) - use lighter gravity when jump key is held
            if (this.jumpKeyHeld) {
                currentGravity = this.jumpGravity;
                // Reset transition timer when key is held
                this.gravityTransitionTimer = 0;
            } else {
                // Jump key released - smoothly transition from light to heavy gravity
                this.gravityTransitionTimer += deltaTime;
                const transitionProgress = Math.min(this.gravityTransitionTimer / this.gravityTransitionTime, 1.0);
                const smoothProgress = Utils.smoothstep(0, 1, transitionProgress);
                currentGravity = this.jumpGravity + (this.fallGravity - this.jumpGravity) * smoothProgress;
            }
        } else {
            // Moving downward (falling) - use heavy gravity for snappy falls
            currentGravity = this.fallGravity;
        }
        
        this.velocity.y += currentGravity * deltaTime;
        
        // Cap falling speed
        if (this.velocity.y > this.maxFallSpeed) {
            this.velocity.y = this.maxFallSpeed;
        }
        
        // Reset jump key held state at end of frame
        this.jumpKeyHeld = false;
        
        // Clear active directions for next frame
        this.activeDirections.clear();
        
        // Call parent update to handle animation
        super.update(deltaTime);
        
        // Calculate intended position (don't round here - let collision system handle exact positions)
        this.x = Math.round(this.x + this.velocity.x * deltaTime);
        this.y = Math.round(this.y + this.velocity.y * deltaTime);
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
        // Don't round here - let collision system work with exact positions
        this.x = x;
        this.y = y;
    }

    /**
     * Round position to avoid fractional pixels (call after collision resolution)
     */
    roundPosition() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
    }

    /**
     * Reset player to a new position with clean physics state (used for level resets)
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    resetToPosition(x, y) {
        this.x = Math.round(x);
        this.y = Math.round(y);
        
        // Reset velocity and physics state when resetting position
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.physics.onGround = false; // Will be set correctly by collision detection
        this.coyoteTimer = 0; // Reset coyote time
        this.activeDirections.clear(); // Clear any active input directions
        
        // Reset jump state
        this.jumpKeyHeld = false;
        
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

    setOnJump(callback) {
        this.onJump = callback;
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

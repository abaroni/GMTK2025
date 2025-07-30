import { Bounds } from "./components/Bounds.js";
export class Player {
    constructor() {
        this.x = 350;
        this.y = 350;
        this.size = 64;
        this.maxSpeed = 500; // Maximum speed in pixels per second
        this.velocity = { x: 0, y: 0 }; // Current velocity
        this.acceleration = 500; // How quickly player reaches max speed
        this.friction = 0.85; // Velocity decay when no input (per frame)
        this.color = { r: 0, g: 255, b: 0 }; // Green color
        this.bounds = new Bounds(this.size -24, this.size-12, 12, 12); // Initialize bounds with player size
        this.activeDirections = new Set(); // Store currently pressed directions
        
        // Animation properties
        this.animationFrame = 0; // Current animation frame (0-3)
        this.animationTimer = 0; // Timer for animation
        this.animationSpeed = 0.15; // Seconds per frame (configurable)
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
                this.velocity.y -= accelerationAmount;
                break;
            case 'down':
                this.velocity.y += accelerationAmount;
                break;
            case 'left':
                this.velocity.x -= accelerationAmount;
                break;
            case 'right':
                this.velocity.x += accelerationAmount;
                break;
        }
        
        // Clamp velocity to max speed
        const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        if (speed > this.maxSpeed) {
            console.log("Clamping speed to maxSpeed:", this.maxSpeed);
            this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
            this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }
    }

    /**
     * Update player position based on velocity
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(canvasWidth, canvasHeight, deltaTime) {
        // Check if input directions oppose current velocity
        const hasLeft = this.activeDirections.has('left');
        const hasRight = this.activeDirections.has('right');
        const hasUp = this.activeDirections.has('up');
        const hasDown = this.activeDirections.has('down');
        
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
        
        // Check if vertical input opposes current velocity direction
        let hasValidVerticalInput = false;
        if (hasUp || hasDown) {
            if (hasUp && hasDown) {
                // Both directions pressed - apply friction
                hasValidVerticalInput = false;
            } else if (hasUp && this.velocity.y > 0) {
                // Moving down but pressing up - apply friction for direction change
                hasValidVerticalInput = false;
            } else if (hasDown && this.velocity.y < 0) {
                // Moving up but pressing down - apply friction for direction change
                hasValidVerticalInput = false;
            } else {
                // Input aligns with velocity or velocity is zero
                hasValidVerticalInput = true;
            }
        }
        
        // Apply friction based on input validity
        if (!hasValidHorizontalInput) {
            this.velocity.x *= this.friction;
        }
        if (!hasValidVerticalInput) {
            this.velocity.y *= this.friction;
        }
        
        // Clear active directions for next frame
        this.activeDirections.clear();
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Calculate intended position
        const intendedX = this.x + this.velocity.x * deltaTime;
        const intendedY = this.y + this.velocity.y * deltaTime;
        
        // Get collision box for boundary checking
        const collisionBox = this.bounds.getCollisionBox({ x: intendedX, y: intendedY });
        
        // Apply boundary checking using collision box
        const minX = -this.bounds.offsetX;
        const maxX = canvasWidth - this.bounds.width - this.bounds.offsetX;
        const minY = -this.bounds.offsetY;
        const maxY = canvasHeight - this.bounds.height - this.bounds.offsetY;
        
        this.x = Math.max(minX, Math.min(maxX, intendedX));
        this.y = Math.max(minY, Math.min(maxY, intendedY));
        
        // Stop velocity if hitting boundaries using collision box
        const finalCollisionBox = this.bounds.getCollisionBox(this);
        if (finalCollisionBox.x <= 0 || finalCollisionBox.x + finalCollisionBox.width >= canvasWidth) {
            this.velocity.x = 0;
        }
        if (finalCollisionBox.y <= 0 || finalCollisionBox.y + finalCollisionBox.height >= canvasHeight) {
            this.velocity.y = 0;
        }
    }

    /**
     * Update animation frame based on timer
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    updateAnimation(deltaTime) {
        this.animationTimer += deltaTime;
        
        // Check if it's time to advance to next frame
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4; // Cycle through frames 0-3
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
     * Get player position
     * @returns {Object} Position object with x, y coordinates
     */
    getPosition() {
        return { x: this.x, y: this.y };
    }

    /**
     * Get player velocity
     * @returns {Object} Velocity object with x, y components
     */
    getVelocity() {
        return { x: this.velocity.x, y: this.velocity.y };
    }

    /**
     * Get player size
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

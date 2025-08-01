/**
 * Camera - Handles camera positioning, following, and smooth movement
 * 
 * Usage Examples:
 *   // Basic setup
 *   const camera = new Camera(800, 600);
 *   camera.init(player);
 * 
 *   // In render loop
 *   camera.followTarget(player);
 *   camera.applyTransform();
 * 
 *   // Camera controls
 *   camera.setDeadZone(300, 200);   // Set dead zone size
 * 
 *   // Parallax background
 *   const offset = camera.getOffset();
 *   drawParallax(offset.x * 0.5);
 */

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        
        // Current camera position
        this.offsetX = 0;
        this.offsetY = 0;
        
        // Target camera position (where we want the camera to be)
        this.targetX = 0;
        this.targetY = 0;
        
        // Camera settings
        // Dead zone settings
        this.deadZoneWidth = 200; // Width of the dead zone in pixels
        this.deadZoneHeight = 150; // Height of the dead zone in pixels
        this.showDeadZone = true; // Whether to draw debug lines for dead zone
    }

    /**
     * Initialize camera position to center on a target
     * @param {Object} target - Target entity with x, y properties
     */
    init(target) {
        // Start with player centered on screen, no offset applied
        this.targetX = this.canvasWidth / 2 - target.x;
        this.targetY = this.canvasHeight / 2 - target.y;
        
        // Set initial position to target (no interpolation on first frame)
        this.offsetX = this.targetX;
        this.offsetY = this.targetY;
    }

    /**
     * Update camera to follow a target entity
     * @param {Object} target - Target entity with x, y properties
     */
    followTarget(target) {        
        // Get current player position on screen (accounting for player size)
        const playerScreenX = target.x + this.offsetX;
        const playerScreenY = target.y + this.offsetY;
        const playerRightX = playerScreenX + target.getSize();
        const playerBottomY = playerScreenY + target.getSize();
        
        // Calculate dead zone boundaries (centered on screen)
        const deadZoneLeft = (this.canvasWidth - this.deadZoneWidth) / 2;
        const deadZoneRight = (this.canvasWidth + this.deadZoneWidth) / 2;
        const deadZoneTop = (this.canvasHeight - this.deadZoneHeight) / 2;
        const deadZoneBottom = (this.canvasHeight + this.deadZoneHeight) / 2;
        
        // Only move camera if player is outside dead zone
        let newOffsetX = this.offsetX;
        let newOffsetY = this.offsetY;
        
        // Check if player is outside dead zone horizontally
        if (playerScreenX < deadZoneLeft) {
            // Player's left edge is outside dead zone - move camera left
            newOffsetX = this.offsetX + (deadZoneLeft - playerScreenX);
        } else if (playerRightX > deadZoneRight) {
            // Player's right edge is outside dead zone - move camera right
            newOffsetX = this.offsetX + (deadZoneRight - playerRightX);
        }
        
        // Check if player is outside dead zone vertically
        if (playerScreenY < deadZoneTop) {
            // Player's top edge is outside dead zone - move camera up
            newOffsetY = this.offsetY + (deadZoneTop - playerScreenY);
        } else if (playerBottomY > deadZoneBottom) {
            // Player's bottom edge is outside dead zone - move camera down
            newOffsetY = this.offsetY + (deadZoneBottom - playerBottomY);
        }
        
        // Apply camera position instantly (no interpolation)
        this.offsetX = newOffsetX;
        this.offsetY = newOffsetY;
        this.targetX = newOffsetX;
        this.targetY = newOffsetY;
    }

    /**
     * Apply camera transformation to the rendering context
     * This should be called before drawing game objects
     */
    applyTransform() {
        const roundedX = Math.round(this.offsetX);
        const roundedY = Math.round(this.offsetY);
        translate(roundedX, roundedY);
    }

    /**
     * Get camera offset for parallax calculations
     * @returns {Object} Camera offset { x, y }
     */
    getOffset() {
        return {
            x: this.offsetX,
            y: this.offsetY
        };
    }

    /**
     * Set dead zone size
     * @param {number} width - Width of the dead zone in pixels
     * @param {number} height - Height of the dead zone in pixels
     */
    setDeadZone(width, height) {
        this.deadZoneWidth = width;
        this.deadZoneHeight = height;
    }

    /**
     * Toggle dead zone debug visualization
     * @param {boolean} show - Whether to show the dead zone debug lines
     */
    setShowDeadZone(show) {
        this.showDeadZone = show;
    }

    /**
     * Reset camera to a specific position
     * @param {number} x - X offset
     * @param {number} y - Y offset
     */
    setPosition(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Get world position from screen position (useful for UI elements)
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {Object} World position { x, y }
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX - this.offsetX,
            y: screenY - this.offsetY
        };
    }

    /**
     * Get screen position from world position
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object} Screen position { x, y }
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX + this.offsetX,
            y: worldY + this.offsetY
        };
    }
}

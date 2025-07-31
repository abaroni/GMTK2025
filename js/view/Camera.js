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
 *   camera.setDamping(0.1);        // Smooth following
 *   camera.setPlayerOffset(150);   // Offset for look-ahead
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
        this.damping = 0.05; // How fast camera follows (0.1 = smooth, 1.0 = instant)
        this.playerOffsetX = 100; // Offset to adjust for player facing direction
    }

    /**
     * Initialize camera position to center on a target
     * @param {Object} target - Target entity with x, y properties
     */
    init(target) {
        this.targetX = this.canvasWidth / 2 - target.x - this.playerOffsetX;
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
        // Calculate target camera position (where we want the camera to be)
        this.targetX = this.canvasWidth / 2 - target.x - this.playerOffsetX;
        this.targetY = this.canvasHeight / 2 - target.y;
        
        // Smoothly interpolate current camera position toward target
        this.offsetX = this.lerp(this.offsetX, this.targetX, this.damping);
        this.offsetY = this.lerp(this.offsetY, this.targetY, this.damping);
    }

    /**
     * Apply camera transformation to the rendering context
     * This should be called before drawing game objects
     */
    applyTransform() {
        translate(this.offsetX, this.offsetY);
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
     * Set camera damping (smoothness of following)
     * @param {number} damping - Damping value (0-1, where 1 is instant)
     */
    setDamping(damping) {
        this.damping = Math.max(0, Math.min(1, damping));
    }

    /**
     * Set player offset for camera positioning
     * @param {number} offsetX - Horizontal offset from center
     */
    setPlayerOffset(offsetX) {
        this.playerOffsetX = offsetX;
    }

    /**
     * Linear interpolation helper
     * @param {number} start - Starting value
     * @param {number} end - Ending value
     * @param {number} amount - Interpolation amount (0-1)
     * @returns {number} Interpolated value
     */
    lerp(start, end, amount) {
        return start * (1 - amount) + end * amount;
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

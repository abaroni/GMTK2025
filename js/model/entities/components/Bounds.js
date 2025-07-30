export class Bounds {
    constructor(width = 0, height = 0, offsetX = 0, offsetY = 0) {
        this.width = width;      // Width of the collision box
        this.height = height;    // Height of the collision box
        this.offsetX = offsetX;  // Offset from entity's x position
        this.offsetY = offsetY;  // Offset from entity's y position
    }

    /**
     * Get the actual collision box coordinates for an entity
     * @param {Object} entity - The entity that owns these bounds
     * @returns {Object} { x, y, width, height } - Actual collision box
     */
    getCollisionBox(entity) {
        return {
            x: entity.x + this.offsetX,
            y: entity.y + this.offsetY,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Set bounds dimensions
     * @param {number} width - Width of collision box
     * @param {number} height - Height of collision box
     */
    setSize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Set bounds offset from entity position
     * @param {number} offsetX - X offset
     * @param {number} offsetY - Y offset
     */
    setOffset(offsetX, offsetY) {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
     * Check if two entities' bounds intersect (static method)
     * @param {Object} entityA - First entity with bounds
     * @param {Object} entityB - Second entity with bounds
     * @returns {boolean} - Whether they intersect
     */
    static intersects(entityA, entityB) {
        const boxA = entityA.bounds.getCollisionBox(entityA);
        const boxB = entityB.bounds.getCollisionBox(entityB);

        return !(boxA.x + boxA.width < boxB.x ||
                 boxA.x > boxB.x + boxB.width ||
                 boxA.y + boxA.height < boxB.y ||
                 boxA.y > boxB.y + boxB.height);
    }
}
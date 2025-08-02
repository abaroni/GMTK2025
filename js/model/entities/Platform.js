import { Entity } from "./Entity.js";

export class Platform extends Entity {
    constructor(x, y, width, height, type = 'solid') {
        // Call parent constructor
        super(x, y, width, height);

        // Platform-specific properties
        this.type = type;
    }

    /**
     * Platforms don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }

    /**
     * Check if collision should be allowed based on direction and platform type
     * @param {string} direction - Direction of collision ('up', 'down', 'left', 'right')
     * @returns {boolean} - Whether collision should be processed
     */
    shouldCollide(direction) {
        switch (this.type) {
            case 'solid':
                return true; // Always collide
            case 'one-way-up':
                return direction === 'up'; // Only collide when approaching from below
            case 'one-way-down':
                return direction === 'down'; // Only collide when approaching from above
            case 'one-way-left':
                return direction === 'left'; // Only collide when approaching from right
            case 'one-way-right':
                return direction === 'right'; // Only collide when approaching from left
            default:
                return true;
        }
    }

}
import { Bounds } from "./components/Bounds.js";

export class FrozenClone {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.bounds = new Bounds(width, height, 0, 0); // Initialize bounds with platform size
        this.isStatic = true; // Mark as static entity

        
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }


    /**
     * Platforms don't need to update - they're static
     */
    update() {
        // Static entities don't update
    }
}
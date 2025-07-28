import { Bounds } from "./components/Bounds.js";
export class Player {
    constructor(x = 50, y = 50, size = 40, speed = 200) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed; // Speed in pixels per second
        this.color = { r: 0, g: 255, b: 0 }; // Green color
        this.bounds = new Bounds();
    }

    /**
     * Move the player in a specific direction
     * @param {string} direction - 'up', 'down', 'left', 'right'
     * @param {number} canvasWidth - Canvas width for boundary checking
     * @param {number} canvasHeight - Canvas height for boundary checking
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    move(direction, canvasWidth, canvasHeight, deltaTime) {
        const movement = this.speed * deltaTime; // Calculate movement based on time
        
        switch (direction) {
            case 'up':
                this.y = Math.max(0, this.y - movement);
                break;
            case 'down':
                this.y = Math.min(canvasHeight - this.size, this.y + movement);
                break;
            case 'left':
                this.x = Math.max(0, this.x - movement);
                break;
            case 'right':
                this.x = Math.min(canvasWidth - this.size, this.x + movement);
                break;
        }
    }


    getPosition() {
        return { x: this.x, y: this.y };
    }


    getSize() {
        return this.size;
    }


    getColor() {
        return this.color;
    }

}

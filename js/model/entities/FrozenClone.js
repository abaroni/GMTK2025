import { Entity } from "./Entity.js";
import { Bounds } from "./components/Bounds.js";

export class FrozenClone extends Entity {
    constructor(x, y, width, height, onDestroy = null) {
        // Call parent constructor
        super(x, y, width, height);
        this.size = 64; // THIS IS QUITE MESSY, CLONES SHOULD JUST SHARE SOME PROPERTIES WITH PLAYER
        this.bounds = new Bounds(this.size - 24, this.size - 12, 12, 12); 
        
        // FrozenClone-specific properties
        this.onDestroy = onDestroy; // Callback for when clone is destroyed
        
        this.animationSpeed = 0.10;
        this.vfxAlpha = 0;
        setTimeout(() => {
            this.vfxAlpha = 255;
            this.setAnimationEnabled(true, 3);
        }, 150); // Start animation after 150ms
        
        this.animationLoopCallback = () => {
            // Callback when animation loop completes
             this.vfxAlpha = 0; // Alpha for visual effects, can be adjusted
            this.setAnimationEnabled(false); // Disable animation after loop
        }
    }

    /**
     * Update frozen clone (needs to call parent for animation)
     */
    update(deltaTime) {
        // Call parent update to handle animation
        super.update(deltaTime);
    }
}
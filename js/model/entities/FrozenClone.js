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
        this.isMarkedForDestruction = false; // Flag to prevent multiple destruction calls
        
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
        
        // Self-destruct after 5 seconds
        setTimeout(() => {
            this.startSelfDestruct();
        }, 5000); // 5 seconds
    }

    /**
     * Update frozen clone (needs to call parent for animation)
     */
    update(deltaTime) {
        // Call parent update to handle animation
        super.update(deltaTime);
    }

    /**
     * Start the self-destruct sequence
     */
    startSelfDestruct() {
        if (this.isMarkedForDestruction) {
            return; // Already marked for destruction
        }
        
        this.isMarkedForDestruction = true;
        
        // Initialize destruction sequence properties
        this.destructionAnimationCount = 0;
        this.maxDestructionAnimations = 5;
        this.baseDelay = 800; // Base delay in milliseconds
        
        // Start the destruction animation sequence
        this.playDestructionAnimation();
    }

    /**
     * Play a single destruction animation in the sequence
     */
    playDestructionAnimation() {
        this.destructionAnimationCount++;
        
        // Play destruction VFX animation
        this.vfxAlpha = 255;
        this.setAnimationEnabled(true, 3); // Play animation once
        
        // Update animation callback to handle the sequence
        this.animationLoopCallback = () => {
            this.vfxAlpha = 0;
            this.setAnimationEnabled(false);
            
            if (this.destructionAnimationCount < this.maxDestructionAnimations) {
                // Calculate progressively shorter delay
                // Delay gets shorter each time: 800ms, 600ms, 400ms, 200ms, 100ms
                const delay = this.baseDelay - (this.destructionAnimationCount * 150);
                const actualDelay = Math.max(delay, 100); // Minimum 100ms delay
                
                // Schedule next animation
                setTimeout(() => {
                    this.playDestructionAnimation();
                }, actualDelay);
            } else {
                // All animations completed, destroy the clone
                if (this.onDestroy) {
                    this.onDestroy(this);
                }
            }
        };
    }

    /**
     * Check if this clone is marked for destruction
     * @returns {boolean} True if marked for destruction
     */
    isMarkedForDeletion() {
        return this.isMarkedForDestruction;
    }
}
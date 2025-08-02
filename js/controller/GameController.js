export class GameController {
    constructor(gameModel, gameView) {
        this.gameModel = gameModel;
        this.gameView = gameView;
        this.keysPressed = {};
        this.lastPlaceTime = 0; // For manual debouncing of spacebar
    }

    init() {
    }

    /**
     * Update controller logic (called every frame)
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
        this.handleContinuousInput(deltaTime);
    }

    /**
     * Handle continuous input (for smooth movement and diagonal movement)
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    handleContinuousInput(deltaTime) {
        // Check for multiple simultaneous key presses for diagonal movement
        const directions = [];
        
        // Check vertical movement
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // W key
            directions.push('up');
        }
        if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // S key
            directions.push('down');
        }
        
        // Check horizontal movement
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // A key
            directions.push('left');
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // D key
            directions.push('right');
        }
        
        // Check place action with manual debouncing (avoids ghosting)
        const currentTime = millis();
        if (keyIsDown(32) && currentTime - this.lastPlaceTime > 100) { // 100ms debounce to prevent spam
            this.handlePlaceAction();
            this.lastPlaceTime = currentTime;
        }
        
        // Apply input to player for all pressed directions
        directions.forEach(direction => {
            this.gameModel.applyPlayerInput(direction, deltaTime);
        });
    }

    onKeyPressed(keyCode) {
        switch (keyCode) {
            case 27: // Escape key
                this.gameModel.togglePause();
                break;
            case 82: // R key
                this.gameModel.resetLevel();
                break;
            case 81: // Q key
                this.gameModel.removeOldestFrozenClone();
                break;
            case 69: // E key
                this.gameModel.previousLevel();
                break;
        }
    }

    /**
     * Handle place action with cooldown
     */
    handlePlaceAction() {
        // Delegate to the game model
        this.gameModel.handlePlaceAction();
    }
    onKeyReleased(keyCode) {
        // Handle jump key release for variable jump height
        if (keyCode === UP_ARROW || keyCode === 87) { // UP_ARROW or W key
            this.gameModel.getPlayer().onJumpKeyRelease();
        }
    }
    
    onResize() {
        this.gameView.onResize();
    }

}

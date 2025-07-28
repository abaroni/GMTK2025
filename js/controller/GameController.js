export class GameController {
    constructor(gameModel, gameView) {
        this.gameModel = gameModel;
        this.gameView = gameView;
        this.keysPressed = {};
    }

    init() {
    }

    /**
     * Update controller logic (called every frame)
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
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
        
        // Move in all pressed directions (enables diagonal movement)
        directions.forEach(direction => {
            this.gameModel.movePlayer(direction, deltaTime);
        });
    }

    onKeyPressed(keyCode) {
        switch (keyCode) {
            case 32: // Spacebar
                this.gameModel.togglePause();
                break;
            case 27: // Escape key
                this.gameModel.togglePause();
                break;
        }
    }
    onKeyReleased(keyCode) {
    }
    
    onResize() {
        this.gameView.onResize();
    }

}

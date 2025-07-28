/**
 * Main Game File - Integrates MVC components with p5.js
 */

import { GameModel } from './model/GameModel.js';
import { GameView } from './view/GameView.js';
import { GameController } from './controller/GameController.js';

// Global game components
let gameModel;
let gameView;
let gameController;

// Delta time tracking
let lastFrameTime = 0;

/**
 * p5.js setup function - called once at the beginning
 */
function setup() {
    console.log('Setting up game...');
    
    // Initialize delta time tracking
    lastFrameTime = millis();
    
    // Initialize MVC components
    gameModel = new GameModel();
    gameView = new GameView(gameModel);
    gameController = new GameController(gameModel, gameView);
    
    // Initialize all components
    gameModel.init();
    gameView.init();
    gameController.init();
    
    console.log('Game setup complete!');
}

/**
 * p5.js draw function - called continuously (game loop)
 */
function draw() {
    // Calculate delta time in seconds
    const currentTime = millis();
    const deltaTime = (currentTime - lastFrameTime) / 1000; // Convert to seconds
    lastFrameTime = currentTime;
    
    // Cap delta time to prevent large jumps (e.g., when tab loses focus)
    const cappedDeltaTime = Math.min(deltaTime, 1/30); // Max 30 FPS equivalent
    
    // Update game logic with delta time
    gameModel.update(cappedDeltaTime);
    gameController.update(cappedDeltaTime);
    
    // Render the game
    gameView.render();
}

/**
 * p5.js keyPressed function - called when a key is pressed
 */
function keyPressed() {
    if (gameController) {
        gameController.onKeyPressed(keyCode);
    }
    
    // Prevent default browser behavior for arrow keys
    if ([32, 37, 38, 39, 40].includes(keyCode)) {
        return false;
    }
}

/**
 * p5.js keyReleased function - called when a key is released
 */
function keyReleased() {
    if (gameController) {
        gameController.onKeyReleased(keyCode);
    }
}

/**
 * p5.js windowResized function - called when the window is resized
 */
function windowResized() {
    if (gameController) {
        gameController.onResize();
    }
}

/**
 * Handle page unload to clean up resources
 */
window.addEventListener('beforeunload', function() {
    if (gameView) {
        gameView.destroy();
    }
});

// Debug functions for development
function debugGameState() {
    console.log('=== Game Debug Info ===');
    console.log('Game Model:', gameModel);
    console.log('Player Position:', gameModel.getPlayer().getPosition());
    console.log('Game Running:', gameModel.isRunning());
    console.log('======================');
}

// Make debug function globally available
window.debugGameState = debugGameState;

// Make p5.js functions globally available for ES6 modules
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;
window.keyReleased = keyReleased;
window.windowResized = windowResized;

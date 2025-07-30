/**
 * Game View - Handles all rendering and visual presentation
 */
export class GameView {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.canvas = null;
        this.spriteSheet = null; 
    }

    /**
     * Initialize the view with p5.js
     */
    init() {
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        // Create canvas and attach to game-container
        this.canvas = createCanvas(canvasDimensions.width, canvasDimensions.height);
        this.canvas.parent('game-container');
        
        this.spriteSheet = loadImage('assets/ssheet.png');

        console.log('GameView initialized');
    }

    /**
     * Render the entire game frame
     */
    render() {
        this.drawBackground();
        this.drawPlayer();
        this.drawCoins();
        this.drawEnemies();
        this.drawDebugBounds();
        this.drawUI();
    }

    /**
     * Draw the background
     */
    drawBackground() {
        // Set white background
        background(255, 255, 255);
        
        // Optional: Add a border
        stroke(200);
        strokeWeight(2);
        noFill();
        rect(0, 0, width - 1, height - 1);
    }

    /**
     * Draw the player 
     */
    drawPlayer() {
        const player = this.gameModel.getPlayer();
        const position = player.getPosition();
        const size = player.getSize();
        const color = player.getColor();

        noSmooth(); // Disable anti-aliasing for pixel art look
        
        // Get current animation frame
        const frame = player.getAnimationFrame();
        
        // Calculate sprite sheet coordinates for each frame
        const frameXPositions = [16, 32, 48, 64]; // X coordinates for frames 0-3
        const spriteX = frameXPositions[frame];
        
        // Draw the animated sprite
        image(this.spriteSheet, position.x, position.y, 64, 64, spriteX, 16, 16, 16);
    }
    drawCoins() {
        const coins = this.gameModel.getCoins();
        for (const coin of coins) {
            const position = { x: coin.x, y: coin.y };
            const size = coin.size;

            // Draw the coin as a circle
            fill(255, 215, 0); // Gold color
            stroke(0);
            strokeWeight(1);
            ellipse(position.x + size / 2, position.y + size / 2, size, size);
        }
    }
    drawEnemies() {
        const enemies = this.gameModel.getEnemies();
        for (const enemy of enemies) {
            const position = { x: enemy.x, y: enemy.y };
            const size = enemy.size;

            // Draw the enemy as a star
            fill(255, 0, 0); // Red color
            stroke(0);
            strokeWeight(1);
            beginShape();
            for (let i = 0; i < 10; i++) {
                const angle = TWO_PI / 10 * i - HALF_PI; // 10 points for star (5 outer + 5 inner)
                const radius = (i % 2 === 0) ? size / 2 : size / 4; // Alternate between outer and inner radius
                const x = position.x + size / 2 + cos(angle) * radius;
                const y = position.y + size / 2 + sin(angle) * radius;
                vertex(x, y);
            }
            endShape(CLOSE);
        }
    }

    /**
     * Draw debug bounds for all entities with collision boxes
     */
    drawDebugBounds() {
        // Set light gray color for debug bounds
        stroke(180, 180, 180); // Light gray
        strokeWeight(1);
        noFill();

        // Draw player bounds
        const player = this.gameModel.getPlayer();
        if (player.bounds) {
            const playerBox = player.bounds.getCollisionBox(player);
            rect(playerBox.x, playerBox.y, playerBox.width, playerBox.height);
        }

        // Draw coin bounds
        const coins = this.gameModel.getCoins();
        for (const coin of coins) {
            if (coin.bounds) {
                const coinBox = coin.bounds.getCollisionBox(coin);
                rect(coinBox.x, coinBox.y, coinBox.width, coinBox.height);
            }
        }

        // Draw enemy bounds
        const enemies = this.gameModel.getEnemies();
        for (const enemy of enemies) {
            if (enemy.bounds) {
                const enemyBox = enemy.bounds.getCollisionBox(enemy);
                rect(enemyBox.x, enemyBox.y, enemyBox.width, enemyBox.height);
            }
        }
    }

    /**
     * Draw UI elements (score, instructions, etc.)
     */
    drawUI() {
        // Draw score
        fill(0);
        noStroke();
        textAlign(LEFT);
        textSize(16);
        text(`Score: ${this.gameModel.getScore()}`, 10, 25);

        // Draw player debug information
        const player = this.gameModel.getPlayer();
        const position = player.getPosition();
        const velocity = player.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        fill(0, 0, 255); // Blue color for debug info
        textAlign(LEFT);
        textSize(12);
        let debugY = 50;
        text(`Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`, 10, debugY);
        debugY += 15;
        text(`Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`, 10, debugY);
        debugY += 15;
        text(`Speed: ${speed.toFixed(1)} / ${player.maxSpeed}`, 10, debugY);
        debugY += 15;
        text(`Size: ${player.getSize()}`, 10, debugY);

        // Draw game status
        if (!this.gameModel.isRunning()) {
            fill(255, 0, 0);
            textAlign(CENTER);
            textSize(32);
            text('PAUSED', width / 2, height / 2);
        }

        // Draw controls info
        fill(100);
        textAlign(RIGHT);
        textSize(12);
        text('Use arrow keys or WASD to move', width - 10, height - 10);
    }

    /**
     * Handle window resize
     */
    onResize() {
        // Keep canvas size consistent
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        resizeCanvas(canvasDimensions.width, canvasDimensions.height);
    }

    /**
     * Clean up view resources
     */
    destroy() {
        if (this.canvas) {
            this.canvas.remove();
        }
    }
}

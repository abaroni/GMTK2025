/**
 * Game View - Handles all rendering and visual presentation
 */
export class GameView {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.canvas = null;
        this.spriteSheet = null; 
        this.cameraOffsetX = 0; // Offset for camera to center player
        this.cameraOffsetY = 0; // Offset for camera to center player vertically
        this.targetCameraX = 0; // Target camera position for smooth following
        this.targetCameraY = 0; // Target camera position for smooth following
        this.cameraDamping = 0.05; // How fast camera follows (0.1 = smooth, 1.0 = instant)
    }

    /**
     * Initialize the view with p5.js
     */
    init() {
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        // Create canvas and attach to game-container
        this.canvas = createCanvas(canvasDimensions.width, canvasDimensions.height);
        this.canvas.parent('game-container');
        
        this.spriteSheet = loadImage('assets/ssheetT.png');

        // Calculate target camera position (where we want the camera to be)
        this.targetCameraX = this.gameModel.canvasWidth/2 - this.gameModel.getPlayer().x - 100; //TODO adjust for player facing direction
        this.targetCameraY = this.gameModel.canvasHeight/2 - this.gameModel.getPlayer().y;

        this.cameraOffsetX = this.targetCameraX;
        this.cameraOffsetY = this.targetCameraY;

        console.log('GameView initialized');
    }

    /**
     * Render the entire game frame
     */
    render() {
        // Calculate target camera position (where we want the camera to be)
        this.targetCameraX = this.gameModel.canvasWidth/2 - this.gameModel.getPlayer().x - 100; //TODO adjust for player facing direction
        this.targetCameraY = this.gameModel.canvasHeight/2 - this.gameModel.getPlayer().y;
        
        // Smoothly interpolate current camera position toward target
        this.cameraOffsetX = lerp(this.cameraOffsetX, this.targetCameraX, this.cameraDamping);
        this.cameraOffsetY = lerp(this.cameraOffsetY, this.targetCameraY, this.cameraDamping);
        
        // Draw background BEFORE camera translation so it can have its own parallax movement
        this.drawBackground();
        
        // Apply camera translation for all game objects
        translate(this.cameraOffsetX, this.cameraOffsetY);
        this.drawPlatforms();
        this.drawFrozenClones();
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
        
        // Draw parallax layers - furthest to nearest (more visible speeds for testing)
        this.drawParallaxLayer(0.1, 200, 250, 100, 0, color(220, 220, 220, 255)); // Far mountains - slow but visible
        this.drawParallaxLayer(0.2, 100, 225, 75, 0, color(250, 230, 220, 255)); // Mid mountains
        this.drawParallaxLayer(0.3, 150, 200, 50, 0, color(150, 240, 200, 255)); // Near hills - medium speed
        //this.drawParallaxLayer(0.7, 100, 100, 50, 50, color(100, 150, 255, 255)); // Foreground elements
    }

    /**
     * Draw a parallax layer with rectangles
     * @param {number} parallaxSpeed - Speed multiplier for parallax (0-1, where 1 moves with camera)
     * @param {number} spacing - Distance between rectangles
     * @param {number} height - Height of rectangles
     * @param {number} width - Width of rectangles
     * @param {number} yOffset - Vertical offset from bottom
     * @param {color} rectColor - Color of the rectangles
     */
    drawParallaxLayer(parallaxSpeed, spacing, height, width, yOffset, rectColor) {
        // Calculate parallax offset (preserve floating-point precision)
        const parallaxOffset = this.cameraOffsetX * parallaxSpeed;
        
        
        // Calculate visible range with floating-point precision
        const screenWidth = this.gameModel.canvasWidth;
        const leftEdge = -parallaxOffset - screenWidth;
        const rightEdge = -parallaxOffset + screenWidth * 2;
        
        // Calculate first rectangle index (allow floating-point precision)
        const firstIndex = Math.floor(leftEdge / spacing);
        const lastIndex = Math.ceil(rightEdge / spacing);
        
        fill(rectColor);
        noStroke();
        
        // Draw rectangles with precise floating-point positioning
        for (let i = firstIndex; i <= lastIndex; i++) {
            const rectX = i * spacing + parallaxOffset;
            const rectY = this.gameModel.canvasHeight - height - yOffset;
            rect(rectX, rectY, width, height);
        }
    }

    drawFrozenClones() {
        const frozenClones = this.gameModel.frozenClones;
        for (const clone of frozenClones) {
            // Draw frozen clone as a player frame with a blue tint
            const position = clone.getPosition();
           
            // Calculate sprite sheet coordinates for each frame
            const frameXPositions = [16, 32, 48, 64]; // X coordinates for frames 0-3
            const spriteX = frameXPositions[0];
            const spriteY = 16; // Y coordinate for the player sprite rowd
            
            // Set blue tint for frozen clones
            tint(100, 100, 255, 200); // Light blue with some transparency
            // Draw the animated sprite
            image(this.spriteSheet, position.x - 12, position.y - 12, this.gameModel.player.getSize(), this.gameModel.player.getSize(), spriteX, spriteY, 16, 16);
            // Reset tint for other drawings
            noTint();
        }
    }

    /**
     * Draw all platforms
     */
    drawPlatforms() {
        const platforms = this.gameModel.getPlatforms();
        for (const platform of platforms) {
            // Draw platform as a brown rectangle
            fill(140, 90, 90); // Brown color for platforms
            stroke(100, 20, 20); // Darker brown border
            strokeWeight(2);
            rect(platform.x, platform.y, platform.width, platform.height);
        }
    }

    /**
     * Draw the player 
     */
    drawPlayer() {
        const player = this.gameModel.getPlayer();
        const position = player.getPosition();

        noSmooth(); // Disable anti-aliasing for pixel art look
        
        // Get current animation frame
        const frame = player.getAnimationFrame();
        
        // Calculate sprite sheet coordinates for each frame
        const frameXPositions = [16, 32, 48, 64]; // X coordinates for frames 0-3
        const spriteX = frameXPositions[frame];
        const spriteY = 16; // Y coordinate for the player sprite rowd
        
        // Draw the animated sprite
        image(this.spriteSheet, position.x, position.y, player.getSize(), player.getSize(), spriteX, spriteY, 16, 16);
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

        // Draw player bounds and position
        const player = this.gameModel.getPlayer();
        if (player.bounds) {
            const playerBox = player.bounds.getCollisionBox(player);
            rect(playerBox.x, playerBox.y, playerBox.width, playerBox.height);
            
            // Draw black border around entity
            stroke(0, 0, 0); // Black
            strokeWeight(1);
            noFill();
            rect(player.x, player.y, player.getSize(), player.getSize());
        }

        // Draw coin bounds and positions
        const coins = this.gameModel.getCoins();
        for (const coin of coins) {
            if (coin.bounds) {
                // Draw bounds
                stroke(180, 180, 180);
                strokeWeight(1);
                noFill();
                const coinBox = coin.bounds.getCollisionBox(coin);
                rect(coinBox.x, coinBox.y, coinBox.width, coinBox.height);
                
                // Draw black border around entity
                stroke(0, 0, 0); // Black
                strokeWeight(1);
                noFill();
                rect(coin.x, coin.y, coin.size, coin.size);
            }
        }

        // Draw enemy bounds and positions
        const enemies = this.gameModel.getEnemies();
        for (const enemy of enemies) {
            if (enemy.bounds) {
                // Draw bounds
                stroke(180, 180, 180);
                strokeWeight(1);
                noFill();
                const enemyBox = enemy.bounds.getCollisionBox(enemy);
                rect(enemyBox.x, enemyBox.y, enemyBox.width, enemyBox.height);
                
                // Draw black border around entity
                stroke(0, 0, 0); // Black
                strokeWeight(1);
                noFill();
                rect(enemy.x, enemy.y, enemy.size, enemy.size);
            }
        }

        // Draw platform bounds and positions
        const platforms = this.gameModel.getPlatforms();
        for (const platform of platforms) {
            if (platform.bounds) {
                // Draw bounds
                stroke(240, 230, 230);
                strokeWeight(1);
                noFill();
                const platformBox = platform.bounds.getCollisionBox(platform);
                rect(platformBox.x, platformBox.y, platformBox.width, platformBox.height);
                
                // Draw black border around entity
                stroke(0, 0, 0); // Black
                strokeWeight(1);
                noFill();
                rect(platform.x, platform.y, platform.width, platform.height);
            }
        }

        // Draw frozen clone bounds and positions
        const frozenClones = this.gameModel.frozenClones;
        for (const clone of frozenClones) {
            if (clone.bounds) {
                // Draw bounds
                stroke(200, 200, 255); // Light blue for frozen clones
                strokeWeight(1);
                noFill();
                const cloneBox = clone.bounds.getCollisionBox(clone);
                rect(cloneBox.x, cloneBox.y, cloneBox.width, cloneBox.height);
                
                // Draw black border around entity
                stroke(0, 0, 0); // Black
                strokeWeight(1);
                noFill();
                rect(clone.x, clone.y, clone.width, clone.height);
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
        const offsetX = 10 - this.cameraOffsetX;
        const offsetY = 25 - this.cameraOffsetY;
        text(`Score: ${this.gameModel.getScore()}`, offsetX, offsetY);

        // Draw player debug information
        const player = this.gameModel.getPlayer();
        const position = player.getPosition();
        const velocity = player.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        fill(0, 0, 255); // Blue color for debug info
        textAlign(LEFT);
        textSize(12);
        let debugY = 50 - this.cameraOffsetY;
        text(`Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`, offsetX, debugY);
        debugY += 15;
        text(`Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`, offsetX, debugY);
        debugY += 15;
        text(`Speed: ${speed.toFixed(1)} / ${player.maxSpeed}`, offsetX, debugY);
        debugY += 15;
        text(`Size: ${player.getSize()}`, offsetX, debugY);
        debugY += 15;
        
        // Draw placement cooldown info
        const placeCooldown = this.gameModel.getPlaceCooldown ? this.gameModel.getPlaceCooldown() : 0;
        if (placeCooldown > 0) {
            text(`Place Cooldown: ${(placeCooldown / 1000).toFixed(1)}s`, offsetX, debugY);
        } else {
            text(`Place: Ready`, offsetX, debugY);
        }

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
        text('Use arrow keys or WASD to move, space to place a frozen clone', offsetX + width - 20, this.gameModel.canvasHeight - 10 - this.cameraOffsetY);
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

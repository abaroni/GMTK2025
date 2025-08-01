/**
 * Game View - Handles all rendering and visual presentation
 */
import { Camera } from './Camera.js';
import { PlatformRenderer } from './renderers/PlatformRenderer.js';

export class GameView {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.canvas = null;
        this.spriteSheet = null;
        this.newSpriteSheet = null; // Placeholder for new sprite sheet if needed
        this.backgroundColor = "#000000"; // Default background color
        // Initialize camera with canvas dimensions
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        this.camera = new Camera(canvasDimensions.width, canvasDimensions.height);
        
        // Initialize platform renderer (will be set up in init())
        this.platformRenderer = null;
        
        // FPS tracking
        this.frameCount = 0;
        this.lastFPSUpdate = Date.now();
        this.currentFPS = 0;
        this.fpsUpdateInterval = 50;
        
        // Debug settings
        this.showDebugBounds = true; // Default to showing debug bounds 
    }

    /**
     * Initialize the view with p5.js
     */
    init() {
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        // Create canvas and attach to game-container
        this.canvas = createCanvas(canvasDimensions.width, canvasDimensions.height);
        this.canvas.parent('game-container');
        
        //this.spriteSheet = loadImage('assets/ssheetT.png');
        this.newSpriteSheet = loadImage('assets/BunSpriteSheet2.png'); 
        
        // Initialize platform renderer with tile sheet and matching tile size
        this.platformRenderer = new PlatformRenderer(this.newSpriteSheet, 50);
        
        // Initialize camera to follow the player
        this.camera.init(this.gameModel.getPlayer());

        console.log('GameView initialized');
    }

    /**
     * Render the entire game frame
     */
    render() {
        // Update FPS tracking
        this.updateFPS();
        
        // Update camera to follow the player
        this.camera.followTarget(this.gameModel.getPlayer());
        
        // Update viewport bounds for culling based on camera position
        const cameraOffset = this.camera.getOffset();
        this.gameModel.updateViewport(cameraOffset.x, cameraOffset.y);
        
        // Draw background BEFORE camera translation so it can have its own parallax movement
        this.drawBackground();
        
        // Apply camera transformation for all game objects
        this.camera.applyTransform();
        this.drawPlatforms();
        this.drawFrozenClones();
        this.drawPlayer();
        this.drawCoins();
        this.drawEnemies();
        if (this.showDebugBounds) {
            this.drawDebugBounds();
        }
        this.drawUI();
    }

    /**
     * Update FPS tracking
     */
    updateFPS() {
        this.frameCount++;
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastFPSUpdate;
        
        // Update FPS display every fpsUpdateInterval milliseconds
        if (timeDelta >= this.fpsUpdateInterval) {
            this.currentFPS = Math.round((this.frameCount / timeDelta) * 1000);
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
            if (this.currentFPS < 59) {
                console.warn(`Low FPS detected: ${this.currentFPS}`);
            }
        }
    }

    /**
     * Draw the background
     */
    drawBackground() {
        background(this.backgroundColor);
        
        // Draw parallax layers - furthest to nearest (more visible speeds for testing)
        //this.drawParallaxLayer(0.1, 200, 250, 100, 0, color( "#0B0B0F")); // Far mountains - slow but visible
        //this.drawParallaxLayer(0.2, 100, 225, 75, 0, color("#14141C")); // Mid mountains
        //this.drawParallaxLayer(0.3, 150, 200, 50, 0, color("#1E1F2B")); // Near hills - medium speed
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
        // Get camera offset for parallax calculations
        const cameraOffset = this.camera.getOffset();
        
        // Calculate parallax offset (preserve floating-point precision)
        const parallaxOffset = cameraOffset.x * parallaxSpeed;
        
        
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
            // Check if frozen clone is within viewport before rendering
            if (this.gameModel.isEntityInViewport(clone)) {
                // Draw frozen clone as a player frame with a blue tint
                const position = clone.getPosition();
               
                const frame = clone.getAnimationFrame();
                const frameXPositions = [16, 32, 48]; // X coordinates for frames 0-2
                const spriteX = frameXPositions[frame];
                const spriteY = 16*4; // Y coordinate for the player sprite rowd
                
                // Set blue tint for frozen clones
                // Draw the animated sprite
                image(this.newSpriteSheet, position.x , position.y , this.gameModel.player.getSize(), this.gameModel.player.getSize(), 16*4, 16*7, 16, 16);
                
                tint(255, clone.vfxAlpha)
                image(this.newSpriteSheet, position.x , position.y, this.gameModel.player.getSize(), this.gameModel.player.getSize(), spriteX, 16*3, 16, 16);
                
                // Reset tint for other drawings
                noTint();
            }
        }
    }

    /**
     * Draw all platforms using tile-based rendering
     */
    drawPlatforms() {
        const platforms = this.gameModel.getPlatforms();
        for (const platform of platforms) {
            // Check if platform is within viewport before rendering
            if (this.gameModel.isEntityInViewport(platform)) {
                // Use tile-based platform renderer with all platforms for adjacency checking
                this.platformRenderer.drawPlatform(platform, platforms);
            }
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
        let spriteX = null;
        let spriteY = null;
        
        let destinationX = position.x ; // Center player on x
        let destinationY = position.y ; // Center player on y
        // Draw the animated sprite
        // image(this.spriteSheet, position.x, position.y, player.getSize(), player.getSize(), spriteX, spriteY, 16, 16);
        push();
        if( player.facingDirection === 'left') {
            scale(-1, 1);
            destinationX = -destinationX - player.getSize(); // Flip horizontally
        }

        if(player.physics.onGround){
            spriteX = player.isRunning? frameXPositions[frame] : frameXPositions[0];
            spriteY = 16*6;
        }else{
            spriteX = frameXPositions[frame];
            spriteY = 16*7;
        }
        image(this.newSpriteSheet,  destinationX, destinationY, player.getSize(), player.getSize(), spriteX, spriteY, 16, 16);
        pop();
    }
    drawCoins() {
        const coins = this.gameModel.getCoins();
        for (const coin of coins) {
            // Check if coin is within viewport before rendering
            if (this.gameModel.isEntityInViewport(coin)) {
                const position = { x: coin.x, y: coin.y };
                const size = coin.size;

                const frame = coin.getAnimationFrame();
                if (coin.isPlayingCustomAnimation) {                
                    const spriteX = 16*3;
                    const spriteY = 16*4; // Y coordinate for the player sprite rowd
                    
                    // Set blue tint for frozen clones
                    //tint(100, 100, 255, 200); // Light blue with some transparency
                    // Draw the animated sprite
                    image(this.newSpriteSheet, position.x , position.y , size, size, spriteX, spriteY, 16, 16);
                }else{
                    // Calculate sprite sheet coordinates for each frame
                    const frameXPositions = [16, 32, 48]; // X coordinates for frames 0-2
                    const spriteX = frameXPositions[frame];
                    const spriteY = 16*4; // Y coordinate for the player sprite rowd
                    
                    // Set blue tint for frozen clones
                    //tint(100, 100, 255, 200); // Light blue with some transparency
                    // Draw the animated sprite
                    image(this.newSpriteSheet, position.x , position.y , size, size, spriteX, spriteY, 16, 16);
                }
            }
        }
    }
    drawEnemies() {
        const enemies = this.gameModel.getEnemies();
        for (const enemy of enemies) {
            // Check if enemy is within viewport before rendering
            if (this.gameModel.isEntityInViewport(enemy)) {
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
    }

    /**
     * Draw debug bounds for all entities with collision boxes
     */
    drawDebugBounds() {
        // Draw player debug information
        const debugPlayer = this.gameModel.getPlayer();
        const position = debugPlayer.getPosition();
        const velocity = debugPlayer.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // Get camera offset for UI positioning
        const cameraOffset = this.camera.getOffset();
        const offsetX = 10 - cameraOffset.x;
        
        fill(0, 0, 255); // Blue color for debug info
        noStroke();
        textAlign(LEFT);
        textSize(12);
        let debugY = 80 - cameraOffset.y;
        text(`FPS: ${this.currentFPS}`, offsetX, debugY);
        debugY += 15;
        text(`Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`, offsetX, debugY);
        debugY += 15;
        text(`Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`, offsetX, debugY);
        debugY += 15;
        text(`Speed: ${speed.toFixed(1)} / ${debugPlayer.maxSpeed}`, offsetX, debugY);
        debugY += 15;
        text(`Size: ${debugPlayer.getSize()}`, offsetX, debugY);
        debugY += 15;
        
        // Draw placement cooldown info
        const placeCooldown = this.gameModel.getPlaceCooldown ? this.gameModel.getPlaceCooldown() : 0;
 
        if (placeCooldown > 0) {
            text(`Place Cooldown: ${(placeCooldown / 1000).toFixed(1)}s`, offsetX, debugY);
        } else {
            text(`Place: Ready`, offsetX, debugY);
        }
        debugY += 15;
        
        // Draw viewport info
        const viewport = this.gameModel.getViewport();
        text(`Viewport: L:${viewport.left.toFixed(0)} R:${viewport.right.toFixed(0)} T:${viewport.top.toFixed(0)} B:${viewport.bottom.toFixed(0)}`, offsetX, debugY);
        debugY += 15;
        
        // Count visible entities for culling debug info
        const totalEntities = this.gameModel.getPlatforms().length + this.gameModel.getCoins().length + 
                             this.gameModel.getEnemies().length + this.gameModel.getFrozenClones().length;
        const visibleEntities = this.gameModel.getPlatforms().filter(p => this.gameModel.isEntityInViewport(p)).length +
                               this.gameModel.getCoins().filter(c => this.gameModel.isEntityInViewport(c)).length +
                               this.gameModel.getEnemies().filter(e => this.gameModel.isEntityInViewport(e)).length +
                               this.gameModel.getFrozenClones().filter(f => this.gameModel.isEntityInViewport(f)).length;
        text(`Entities: ${visibleEntities}/${totalEntities} visible (${((1 - visibleEntities/totalEntities) * 100).toFixed(1)}% culled)`, offsetX, debugY);

        // Set light gray color for debug bounds
        stroke(180, 180, 180); // Light gray
        strokeWeight(1);
        noFill();

        // Draw player bounds and position
        const player = debugPlayer;
        if (player.bounds) {
            const playerBox = player.bounds.getCollisionBox(player);
            stroke(255, 0, 0, 128); 
            rect(playerBox.x, playerBox.y, playerBox.width, playerBox.height);
            
            
            stroke(255, 0, 0, 128); 
            strokeWeight(1);
            noFill();
            rect(player.x, player.y, player.getSize(), player.getSize());
        }

        // Draw coin bounds and positions
        const coins = this.gameModel.getCoins();
        for (const coin of coins) {
            if (coin.bounds && this.gameModel.isEntityInViewport(coin)) {
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
            if (enemy.bounds && this.gameModel.isEntityInViewport(enemy)) {
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
            if (platform.bounds && this.gameModel.isEntityInViewport(platform)) {
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
            if (clone.bounds && this.gameModel.isEntityInViewport(clone)) {
                // Draw bounds
                stroke(0, 0, 255,128);
                strokeWeight(1);
                noFill();
                const cloneBox = clone.bounds.getCollisionBox(clone);
                rect(cloneBox.x, cloneBox.y, cloneBox.width, cloneBox.height);
                
                // Draw black border around entity
                stroke(0, 0, 255,128);
                strokeWeight(1);
                noFill();
                rect(clone.x, clone.y, clone.width, clone.height);
            }
        }

        // Draw anchor bounds and positions (grey boxes)
        const anchors = this.gameModel.getAnchors();
        for (const anchor of anchors) {
            // Draw anchor as a filled grey box
            fill(128, 128, 128, 150); // Semi-transparent grey
            stroke(100, 100, 100); // Darker grey border
            strokeWeight(2);
            rect(anchor.x, anchor.y, anchor.width, anchor.height);
            
            // Add a small "A" label for identification
            fill(255); // White text
            noStroke();
            textAlign(CENTER);
            textSize(12);
            text("A", anchor.x + anchor.width/2, anchor.y + anchor.height/2 + 4);
        }
        
        // Draw camera dead zone debug
        if (this.camera.showDeadZone) {
            // Calculate dead zone boundaries in world space
            const deadZoneLeft = (this.camera.canvasWidth - this.camera.deadZoneWidth) / 2 - this.camera.offsetX;
            const deadZoneRight = (this.camera.canvasWidth + this.camera.deadZoneWidth) / 2 - this.camera.offsetX;
            const deadZoneTop = (this.camera.canvasHeight - this.camera.deadZoneHeight) / 2 - this.camera.offsetY;
            const deadZoneBottom = (this.camera.canvasHeight + this.camera.deadZoneHeight) / 2 - this.camera.offsetY;
            
            // Draw dead zone rectangle
            stroke(255, 0, 255, 150); // Magenta with transparency
            strokeWeight(2);
            noFill();
            rect(deadZoneLeft, deadZoneTop, this.camera.deadZoneWidth, this.camera.deadZoneHeight);
            
            // Draw center crosshairs
            stroke(255, 0, 255, 100);
            strokeWeight(1);
            const centerX = this.camera.canvasWidth / 2 - this.camera.offsetX;
            const centerY = this.camera.canvasHeight / 2 - this.camera.offsetY;
            
            // Horizontal center line
            line(deadZoneLeft - 20, centerY, deadZoneRight + 20, centerY);
            // Vertical center line
            line(centerX, deadZoneTop - 20, centerX, deadZoneBottom + 20);
            
            // Reset stroke for other drawings
            strokeWeight(1);
            stroke(0);
        }
    }

    /**
     * Draw UI elements (score, instructions, etc.)
     */
    drawUI() {
        // Draw score and level
        fill(color(255, 255, 255,128)); // Set text color to white
        noStroke();
        textAlign(LEFT);
        textSize(16);
        
        // Get camera offset for UI positioning
        const cameraOffset = this.camera.getOffset();
        const offsetX = 10 - cameraOffset.x;
        const offsetY = 25 - cameraOffset.y;
        
        // Draw level info
        text(`Loop: ${this.gameModel.getCurrentLevel()}/${this.gameModel.getMaxLevel()}`, offsetX, offsetY);
        
        // Draw score with cooldown color transition
        const placeCooldown = this.gameModel.getPlaceCooldown ? this.gameModel.getPlaceCooldown() : 0;
        const totalCooldownTime = this.gameModel.getPlaceCooldownTime ? this.gameModel.getPlaceCooldownTime() : 1000;
        
        const defaultColor = color(255, 255, 255, 128);
        if (placeCooldown > 0) {
            // 0 = just started cooldown, 1 = cooldown finished
            const cooldownProgress = 1 - (placeCooldown / totalCooldownTime); 
            const startColor = color(0, 0, 255, 128);
            const interpolatedColor = lerpColor(startColor, defaultColor, cooldownProgress);
            fill(interpolatedColor);
        } else {
            // Default white color when no cooldown
            fill(defaultColor);
        }
        
        text(`Snowflakes: ${this.gameModel.getScore()} / ${this.gameModel.getTotalCoins() }`, offsetX, offsetY + 20);

        // Draw controls info
        fill(color(255, 255, 255,128)); // Set text color to white
        textAlign(RIGHT);
        textSize(12);
        text('Use arrow keys or WASD to move, space to place a frozen clone, Q to delete the older clone, R to restart the current loop', offsetX + width - 20, this.gameModel.canvasHeight - 10 - cameraOffset.y);
        
        // Draw game status
        if (!this.gameModel.isRunning()) {
            fill(255, 0, 0);
            textAlign(CENTER);
            textSize(32);
            text('PAUSED', width / 2, height / 2);
        }

    }

    /**
     * Handle window resize
     */
    onResize() {
        // Keep canvas size consistent
        const canvasDimensions = this.gameModel.getCanvasDimensions();
        resizeCanvas(canvasDimensions.width, canvasDimensions.height);
        
        // Update camera with new canvas dimensions
        this.camera.canvasWidth = canvasDimensions.width;
        this.camera.canvasHeight = canvasDimensions.height;
    }

    /**
     * Get camera instance for external access
     * @returns {Camera} Camera instance
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Set debug bounds visibility
     * @param {boolean} show - Whether to show debug bounds
     */
    setShowDebugBounds(show) {
        this.showDebugBounds = show;
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

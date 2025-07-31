/**
 * Game View - Handles all rendering and visual presentation
 */
export class GameView {
    constructor(gameModel) {
        this.gameModel = gameModel;
        this.canvas = null;
        this.spriteSheet = null; 
        this.cameraX = 0;
        this.houseSpriteSheet = null;
        this.houseSize = 800;
        this.houses = [
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*0}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*1}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*2}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*3}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*4}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*5}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*6}, 
                            {color:color(random(255),random(255),random(255)),x:this.houseSize*7}, 
                        ];
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
        this.houseSpriteSheet = loadImage('assets/houses.png');

        console.log('GameView initialized');
    }

    /**
     * Render the entire game frame
     */
    render() {
        this.cameraX = this.gameModel.canvasWidth/2 - this.gameModel.getPlayer().x
        translate(this.cameraX, 0);
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
        
        const leftOffset = -this.cameraX;
        const leftFirstHouse = leftOffset-(leftOffset%this.houseSize)-this.houseSize;

        const rightOffset = this.gameModel.canvasWidth - this.cameraX;
        const rightFirstHouse = rightOffset-(rightOffset%this.houseSize);


        let leftmostStoredHouse = null;
        let rightmostStoredHouse = null;
        //calculate leftmost stored house
        for (let i = 0; i < this.houses.length; i++) {
            if( leftmostStoredHouse === null || this.houses[i].x < leftmostStoredHouse.x) {
                leftmostStoredHouse = this.houses[i];
            }
            if( rightmostStoredHouse === null || this.houses[i].x > rightmostStoredHouse.x) {
                rightmostStoredHouse = this.houses[i];
            }
        }
        
        if( leftFirstHouse < leftmostStoredHouse.x) {
            //need a new house on the left
            const randomColor = color(random(255), random(255), random(255));
            this.houses.push({color:randomColor, x:leftFirstHouse});
        }
        if( rightFirstHouse > rightmostStoredHouse.x) {
            //need a new house on the right
            const randomColor = color(random(255), random(255), random(255));
            this.houses.push({color:randomColor, x:rightFirstHouse});
        }
        
        //draw all houses
        for (let i = 0; i < this.houses.length; i++) {
            fill(this.houses[i].color);
            rect(this.houses[i].x, 0, this.houseSize, this.houseSize);
            
            image(this.houseSpriteSheet, this.houses[i].x, -100, 200*4, 100*4, 0, 0, 200, 100);
        }


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

  
    }

    /**
     * Draw UI elements (score, instructions, etc.)
     */
    drawUI() {

        //calculate UI x position to account for camera offset
        const uiX = 10 - this.cameraX;

        // Draw score
        fill(0);
        noStroke();
        textAlign(LEFT);
        textSize(16);
        text(`Score: ${this.gameModel.getScore()}`, uiX, 25);

        // Draw player debug information
        const player = this.gameModel.getPlayer();
        const position = player.getPosition();
        const velocity = player.getVelocity();
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        fill(0, 0, 0); // Blue color for debug info
        textAlign(LEFT);
        textSize(12);
        let debugY = 50;
        text(`Position: (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`, uiX, debugY);
        debugY += 15;
        text(`Velocity: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)})`, uiX, debugY);
        debugY += 15;
        text(`Speed: ${speed.toFixed(1)} / ${player.maxSpeed}`, uiX, debugY);
        debugY += 15;
        text(`Size: ${player.getSize()}`, uiX, debugY);

        //Draw camera position
        debugY += 15;
        text(`Camera X: ${this.cameraX.toFixed(1)}`, uiX, debugY);

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
        text('Use arrow keys or WASD to move', width + uiX - 15, height - 10);
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

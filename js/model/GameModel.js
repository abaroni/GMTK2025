import { Player } from './entities/Player.js';
import { Coin } from './entities/Coin.js';
import { Enemy } from './entities/Enemy.js';
import { Platform } from './entities/Platform.js';
import { CollisionEngine } from './CollisionEngine.js';
/**
 * Game Model - Manages the overall game state and entities
 */
export class GameModel {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.player = new Player();
        this.coins = [];
        this.enemies = [];
        this.platforms = []; 
        this.isGameRunning = true;
        this.collisionEngine = new CollisionEngine();
        this.score = 0;
    }

    /**
     * Initialize the game
     */
    init() {
        this.score = 0;
        this.isGameRunning = true;
        this.coins.push(new Coin(300, 200)); // Example coin
        this.coins.push(new Coin(500, 400)); // Example coin

        this.enemies.push(new Enemy(100, 100)); // Example enemy
        this.enemies.push(new Enemy(600, 300)); // Example enemy

        // Create platform instances
        this.platforms.push(new Platform(0, 550, 800, 50)); // Ground platform
        this.platforms.push(new Platform(200, 400, 200, 20)); // Floating platform
        this.platforms.push(new Platform(500, 250, 150, 20)); // Another platform

        // Register entities with collision engine
        this.collisionEngine.register(this.player);
        for (const coin of this.coins) {
            this.collisionEngine.register(coin);
        }
        for (const enemy of this.enemies) {
            this.collisionEngine.register(enemy);
        }
        for (const platform of this.platforms) {
            this.collisionEngine.register(platform);
        }
        this.collisionEngine.subscribe(this.player, (entity) => {
            if (entity instanceof Coin) {
                //remove the coin from the game
                this.coins = this.coins.filter(c => c !== entity);
                this.collisionEngine.unregister(entity);
                this.score += 10; // Increment score on collision with coin
            }
            if (entity instanceof Enemy) {
                this.score -= 10; // Decrement score on collision with enemy
                // Calculate bounce direction and apply velocity-based bounce
                const playerPosition = this.player.getPosition();
                const enemyPosition = entity.getPosition();
                const dx = playerPosition.x - enemyPosition.x;
                const dy = playerPosition.y - enemyPosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                /*
                */
                this.handleStaticCollision(this.player, entity);

                
                if (distance > 0) {
                    const bounceFactor = 2000; // Bounce velocity strength
                    const bounceVector = {
                        x: (dx / distance) * bounceFactor,
                        y: (dy / distance) * bounceFactor
                    };
                    this.player.applyBounce(bounceVector);
                    
                }

            }
            if (entity instanceof Platform) {
                // Handle platform collision - stop player movement into platform
                this.handleStaticCollision(this.player, entity);
            }
        });

    }

    /**
     * Handle collision between player and platform
     * @param {Player} player - The player entity
     * @param {Platform} entity - The platform entity
     */
    handleStaticCollision(player, entity) {
        const playerBox = player.bounds.getCollisionBox(player);
        const platformBox = entity.bounds.getCollisionBox(entity);
        
        // Calculate overlap on each axis
        const overlapX = Math.min(playerBox.x + playerBox.width - platformBox.x, 
                                 platformBox.x + platformBox.width - playerBox.x);
        const overlapY = Math.min(playerBox.y + playerBox.height - platformBox.y, 
                                 platformBox.y + platformBox.height - playerBox.y);
        
        // Resolve collision on the axis with smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (playerBox.x < platformBox.x) {
                // Player hit platform from the left
                player.x = platformBox.x - playerBox.width - player.bounds.offsetX;
            } else {
                // Player hit platform from the right
                player.x = platformBox.x + platformBox.width - player.bounds.offsetX;
            }
            player.velocity.x = 0; // Stop horizontal movement
        } else {
            // Vertical collision
            if (playerBox.y < platformBox.y) {
                // Player hit platform from above (landing on top)
                player.y = platformBox.y - playerBox.height - player.bounds.offsetY;
                player.onGround = true; // Set grounded state if player has this property
            } else {
                // Player hit platform from below (hitting ceiling)
                player.y = platformBox.y + platformBox.height - player.bounds.offsetY;
            }
            player.velocity.y = 0; // Stop vertical movement
        }
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
        if (!this.isGameRunning) return;
        
        // Update player physics
        this.player.update(deltaTime);
        
        // Check collisions
        this.collisionEngine.checkCollisions();
    }

    /**
     * Apply input to player
     * @param {string} direction - Direction to move
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    applyPlayerInput(direction, deltaTime) {
        if (!this.isGameRunning) return;
        
        this.player.applyInput(direction, deltaTime);
    }

    /**
     * Get the player object
     * @returns {Player} Player instance
     */
    getPlayer() {
        return this.player;
    }

    getCoins() {
        return this.coins;
    }
    getEnemies() {
        return this.enemies;
    }
    /**
     * Get canvas dimensions
     * @returns {Object} Canvas dimensions
     */
    getCanvasDimensions() {
        return {
            width: this.canvasWidth,
            height: this.canvasHeight
        };
    }

    /**
     * Get current game score
     * @returns {number} Current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Get all platforms
     * @returns {Array} Array of platform objects
     */
    getPlatforms() {
        return this.platforms;
    }

    /**
     * Check if game is running
     * @returns {boolean} Game running state
     */
    isRunning() {
        return this.isGameRunning;
    }

    /**
     * Pause/Resume game
     */
    togglePause() {
        this.isGameRunning = !this.isGameRunning;
    }

}

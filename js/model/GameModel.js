import { Player } from './entities/Player.js';
import { Coin } from './entities/Coin.js';
import { Enemy } from './entities/Enemy.js';
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
        this.collisionEngine.register(this.player);
        for (const coin of this.coins) {
            this.collisionEngine.register(coin);
        }
        for (const enemy of this.enemies) {
            this.collisionEngine.register(enemy);
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
                
                if (distance > 0) {
                    const bounceFactor = 300; // Bounce velocity strength
                    const bounceVector = {
                        x: (dx / distance) * bounceFactor,
                        y: (dy / distance) * bounceFactor
                    };
                    this.player.applyBounce(bounceVector);
                }
            }
        });

    }

    /**
     * Update game state
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime) {
        if (!this.isGameRunning) return;
        
        // Update player physics
        this.player.update(this.canvasWidth, this.canvasHeight, deltaTime);
        
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

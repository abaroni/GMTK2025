import { Player } from './entities/Player.js';
import { Coin } from './entities/Coin.js';
import { Enemy } from './entities/Enemy.js';
import { Platform } from './entities/Platform.js';
import { FrozenClone } from './entities/FrozenClone.js';
import { CollisionEngine } from './CollisionEngine.js';
import { LevelParser } from './LevelParser.js';
/**
 * Game Model - Manages the overall game state and entities
 */
export class GameModel {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        this.player = new Player();
        this.coins = [];
        this.totalCoins = 0; // Total coins in the level
        this.enemies = [];
        this.platforms = [];
        this.frozenClones = [];
        this.isGameRunning = true;
        this.collisionEngine = new CollisionEngine();
        this.score = 0;
        this.levelParser = new LevelParser();
        this.isLevelCompleting = false; // Flag to prevent multiple completion triggers
        
        // Place action cooldown
        this.placeCooldown = 0;
        this.placeCooldownTime = 1000; // 1 second in milliseconds
    }

    /**
     * Initialize the game
     */
    init() {
        // Load the default level with collision handlers
        this.loadLevel(null, true);

        this.totalCoins = this.coins.length; // Set total coins for level completion tracking
    }

    /**
     * Load a level from a level string
     * @param {string} levelString - Optional level string, uses default if not provided
     * @param {boolean} setupHandlers - Whether to setup collision handlers (default: true)
     */
    loadLevel(levelString = null, setupHandlers = true) {
        // Parse the level
        const entities = this.levelParser.parseLevel(
            levelString || this.levelParser.getDefaultLevel()
        );

        // Clear existing entities
        this.clearLevel();

        // Create game entities from parsed data
        
        // Create platforms
        entities.platforms.forEach(p => {
            this.platforms.push(new Platform(p.x, p.y, p.width, p.height));
        });

        // Create coins
        entities.coins.forEach(c => {
            this.coins.push(new Coin(c.x, c.y));
        });

        // Create enemies
        entities.enemies.forEach(e => {
            this.enemies.push(new Enemy(e.x, e.y));
        });

        // Set player position
        if (entities.player) {
            this.player.resetToPosition(entities.player.x, entities.player.y);
        }

        // Register entities with collision engine
        
        // Player should already be registered, but re-register to be safe
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

        // Setup collision handlers only if requested (avoid duplicate handlers on reset)
        if (setupHandlers) {
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
                if (entity instanceof FrozenClone) {
                    this.handleFrozenCloneCollision(this.player, entity);
                }
            });
        }

        // Reset game state
        this.isGameRunning = true;
    }

    /**
     * Clear all entities from the current level
     */
    clearLevel() {
        // Unregister non-player entities from collision engine
        for (const coin of this.coins) {
            this.collisionEngine.unregister(coin);
        }
        for (const enemy of this.enemies) {
            this.collisionEngine.unregister(enemy);
        }
        for (const platform of this.platforms) {
            this.collisionEngine.unregister(platform);
        }
        for (const frozenClone of this.frozenClones) {
            this.collisionEngine.unregister(frozenClone);
        }
        
        // Clear entity arrays
        this.coins = [];
        this.enemies = [];
        this.platforms = [];
        this.frozenClones = [];
        
        // Don't clear the collision engine completely - keep player registered
    }

    /**
     * Check if level is completed (all coins collected) and reset if so
     */
    checkLevelCompletion() {
        if (this.coins.length === 0 && this.totalCoins > 0 && !this.isLevelCompleting) {
            this.isLevelCompleting = true; // Prevent multiple triggers
            console.log('Level completed! All coins collected. Resetting level...');
            
            // Add a small delay before resetting to let the player see completion
            setTimeout(() => {
                this.resetLevel();
            }, 1000); // 1 second delay
        }
    }

    /**
     * Reset the current level to its initial state
     */
    resetLevel() {
        console.log('Resetting level...');
        
        // Temporarily pause collision detection to prevent jiggling during reset
        const wasRunning = this.isGameRunning;
        this.isGameRunning = false;
        
        // Reload the level without setting up collision handlers again
        this.loadLevel(null, false);
        
        // Update total coins for the reset level
        this.totalCoins = this.coins.length;
        
        // Reset score to 0
        this.score = 0;
        
        // Reset completion flag
        this.isLevelCompleting = false;
        
        // Resume game after a brief pause to allow everything to settle
        setTimeout(() => {
            this.isGameRunning = wasRunning;
        }, 50); // 50ms pause
        
        console.log(`Level reset! Score reset to: ${this.score}, player at: (${this.player.x}, ${this.player.y})`);
    }

    handleFrozenCloneCollision(player, entity) {
        
        const playerBox = player.bounds.getCollisionBox(player);
        const platformBox = entity.bounds.getCollisionBox(entity);
        
        //SPECIAL CASE: FrozenClone on the ground
        if (entity instanceof FrozenClone && player.physics.onGround) {
            // If player collides with a frozen clone while on the ground, move the player on top of the clone
    
            player.y = platformBox.y - playerBox.height - player.bounds.offsetY; // Place player on top of the clone
            player.physics.onGround = true; // Set grounded state using physics component
            player.velocity.y = 0; // Stop vertical movement
            return;
        }

        

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
                player.physics.onGround = true; // Set grounded state using physics component
            } else {
                // Player hit platform from below (hitting ceiling)
                player.y = platformBox.y + platformBox.height - player.bounds.offsetY;
            }
            player.velocity.y = 0; // Stop vertical movement
        }

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
                player.physics.onGround = true; // Set grounded state using physics component
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
        
        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Update player physics
        this.player.update(deltaTime);
        
        // Check collisions
        this.collisionEngine.checkCollisions();
        
        // Check if level is completed (all coins collected)
        this.checkLevelCompletion();
    }

    /**
     * Update cooldown timers
     * @param {number} deltaTime - Time elapsed since last frame in seconds
     */
    updateCooldowns(deltaTime) {
        if (this.placeCooldown > 0) {
            this.placeCooldown -= deltaTime * 1000; // Convert to milliseconds
            if (this.placeCooldown < 0) {
                this.placeCooldown = 0;
            }
        }
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
     * Handle place action with cooldown
     * @returns {boolean} Whether the action was successful
     */
    handlePlaceAction() {
        // Check if cooldown is active
        if (this.placeCooldown > 0) {
            //console.log(`Place action on cooldown. ${(this.placeCooldown / 1000).toFixed(1)}s remaining`);
            return false;
        }

        // Get player position
        const playerPosition = this.player.getPosition();
        
        // Set cooldown
        this.placeCooldown = this.placeCooldownTime;
        const playerCollisionBox = this.player.bounds.getCollisionBox(this.player);
        const frozenClone = new FrozenClone(Math.round(playerPosition.x)+12, Math.round(playerPosition.y)+12, playerCollisionBox.width, playerCollisionBox.height);
        this.frozenClones.push(frozenClone);
        //register the frozen clone with the collision engine after 150ms
        setTimeout(() => {
            this.collisionEngine.register(frozenClone);
        }, 600); // Register after 150ms grace period

        return true;
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
    
    getTotalCoins() {
        return this.totalCoins;
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
     * Get current placement cooldown
     * @returns {number} Placement cooldown in milliseconds
     */
    getPlaceCooldown() {
        return this.placeCooldown;
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

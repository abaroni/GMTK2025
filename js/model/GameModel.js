import { Player } from './entities/Player.js';
import { Coin } from './entities/Coin.js';
import { Enemy } from './entities/Enemy.js';
import { Platform } from './entities/Platform.js';
import { FrozenClone } from './entities/FrozenClone.js';
import { Anchor } from './entities/Anchor.js';
import { CollisionEngine } from './CollisionEngine.js';
import { LevelParser } from './LevelParser.js';
import { LevelDefinitions } from './LevelDefinitions.js';
/**
 * Game Model - Manages the overall game state and entities
 */
export class GameModel {
    constructor() {
        this.canvasWidth = 800;
        this.canvasHeight = 600;
        
        // Viewport culling information
        this.viewport = {
            left: 0,
            right: this.canvasWidth,
            top: 0,
            bottom: this.canvasHeight,
            buffer: 150 // Extra pixels around visible area to handle partially visible entities
        };
        
        this.player = new Player();
        this.coins = [];
        this.totalCoins = 0; // Total coins in the level
        this.enemies = [];
        this.platforms = [];
        this.frozenClones = [];
        this.anchors = []; // Anchors for reference points (not collidable)
        this.isGameRunning = true;
        this.collisionEngine = new CollisionEngine();
        this.score = 0;
        this.levelParser = new LevelParser();
        this.levelDefinitions = new LevelDefinitions(this.levelParser);
        this.isLevelCompleting = false; // Flag to prevent multiple completion triggers
        
        // Multi-level system
        this.currentLevel = 1;
        this.maxLevel = this.levelDefinitions.getMaxLevel();
        
        // Place action cooldown
        this.placeCooldown = 0;
        this.placeCooldownTime = 1000; // 1 second in milliseconds
    }

    /**
     * Initialize the game
     */
    init() {
        // Load the current level with collision handlers
        this.loadCurrentLevel(true);

        this.totalCoins = this.coins.length; // Set total coins for level completion tracking
    }

    /**
     * Load the current level
     * @param {boolean} setupHandlers - Whether to setup collision handlers (default: true)
     * @param {boolean} preserveClones - Whether to preserve existing frozen clones (default: false)
     */
    loadCurrentLevel(setupHandlers = true, preserveClones = false) {
        const levelString = this.levelDefinitions.getLevel(this.currentLevel);
        if (!levelString) {
            console.error(`Level ${this.currentLevel} not found!`);
            return;
        }
        
        console.log(`Loading Level ${this.currentLevel}...`);
        this.loadLevel(levelString, setupHandlers, preserveClones);
    }

    /**
     * Load a level from a level string
     * @param {string} levelString - Optional level string, uses default if not provided
     * @param {boolean} setupHandlers - Whether to setup collision handlers (default: true)
     * @param {boolean} preserveClones - Whether to preserve existing frozen clones (default: false)
     */
    loadLevel(levelString = null, setupHandlers = true, preserveClones = false) {
        // Parse the level
        const entities = this.levelParser.parseLevel(
            levelString || this.levelParser.getDefaultLevel()
        );

        // Store existing clones if they should be preserved
        const existingClones = preserveClones ? [...this.frozenClones] : [];

        // Clear existing entities (this will clear clones unless we preserve them)
        this.clearLevel(preserveClones);

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
            
            // Create anchor above the player starting position
            const anchor = new Anchor(entities.player.x, entities.player.y - 50); // 50 pixels above player
            this.anchors.push(anchor);
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
                    //this.coins = this.coins.filter(c => c !== entity);
                    this.collisionEngine.unregister(entity);
                    entity.playCustomAnimation({onComplete: () => {
                            // Remove coin from game after animation completes
                            this.coins = this.coins.filter(c => c !== entity);
                        },
                    })
                    this.score += 1; // Increment score on collision with coin
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
                    this.handleStaticCollision(this.player, entity);
                }
            });
        }

        // Reset game state
        this.isGameRunning = true;
    }

    /**
     * Clear all entities from the current level
     * @param {boolean} preserveClones - Whether to preserve existing frozen clones (default: false)
     */
    clearLevel(preserveClones = false) {
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
        
        // Only unregister and clear clones if not preserving them
        if (!preserveClones) {
            for (const frozenClone of this.frozenClones) {
                this.collisionEngine.unregister(frozenClone);
            }
        }
        
        this.score = 0;

        // Clear entity arrays (preserve clones if requested)
        this.coins = [];
        this.enemies = [];
        this.platforms = [];
        if (!preserveClones) {
            this.frozenClones = [];
        }
        this.anchors = []; // Clear anchors (they don't register with collision engine)
        
        // Don't clear the collision engine completely - keep player registered
    }

    /**
     * Check if level is completed (all coins collected) and progress to next level or reset
     */
    checkLevelCompletion() {
        if (this.coins.length === 0 && this.totalCoins > 0 && !this.isLevelCompleting) {
            this.isLevelCompleting = true; // Prevent multiple triggers
            
            if (this.currentLevel < this.maxLevel) {
                // Progress to next level
                console.log(`Level ${this.currentLevel} completed! Progressing to Level ${this.currentLevel + 1}...`);
                
                // Add a delay before progressing to let the player see completion
                setTimeout(() => {
                    this.nextLevel();
                }, 1500); // 1.5 second delay
            } else {
                // All levels completed - show completion message and restart from level 1
                console.log('🎉 Congratulations! All levels completed! 🎉');
                console.log('Restarting from Level 1...');
                
                setTimeout(() => {
                    this.restartGame();
                }, 2000); // 2 second delay to show completion
            }
        }
    }

    /**
     * Progress to the next level
     */
    nextLevel() {
        if (this.currentLevel < this.maxLevel) {
            const fromLevel = this.currentLevel;
            const toLevel = this.currentLevel + 1;
            
            // Check if clones should be preserved for this level transition
            const preserveClones = this.levelDefinitions.shouldPreserveClones(fromLevel, toLevel);
            
            this.currentLevel++;
            console.log(`Starting Level ${this.currentLevel}...`);
            
            if (preserveClones) {
                console.log(`Preserving frozen clones from Level ${fromLevel} to Level ${toLevel}`);
            }
            
            // Temporarily pause collision detection during level transition
            const wasRunning = this.isGameRunning;
            this.isGameRunning = false;
            
            // Load the new level without setting up collision handlers again, optionally preserving clones
            this.loadCurrentLevel(false, preserveClones);
            
            // Update total coins for the new level
            this.totalCoins = this.coins.length;
            
            // Reset completion flag
            this.isLevelCompleting = false;
            
            // Resume game after a brief pause
            setTimeout(() => {
                this.isGameRunning = wasRunning;
            }, 100); // 100ms pause
            
            const cloneInfo = preserveClones ? ` (${this.frozenClones.length} clones preserved)` : '';
            console.log(`Level ${this.currentLevel} loaded! Coins to collect: ${this.totalCoins}, Score: ${this.score}${cloneInfo}`);
        }
    }

    /**
     * Restart the game from level 1
     */
    restartGame() {
        console.log('Restarting game from Level 1...');
        
        // Reset to level 1
        this.currentLevel = 1;
        
        // Reset score
        this.score = 0;
        
        // Temporarily pause collision detection during restart
        const wasRunning = this.isGameRunning;
        this.isGameRunning = false;
        
        // Load level 1 without setting up collision handlers again
        this.loadCurrentLevel(false);
        
        // Update total coins for level 1
        this.totalCoins = this.coins.length;
        
        // Reset completion flag
        this.isLevelCompleting = false;
        
        // Resume game after a brief pause
        setTimeout(() => {
            this.isGameRunning = wasRunning;
        }, 100); // 100ms pause
        
        console.log(`Game restarted! Level 1 loaded, Score reset to: ${this.score}`);
    }

    /**
     * Reset the current level to its initial state
     */
    resetLevel() {
        console.log(`Resetting Level ${this.currentLevel}...`);
        
        // Temporarily pause collision detection to prevent jiggling during reset
        const wasRunning = this.isGameRunning;
        this.isGameRunning = false;
        
        // Reload the current level without setting up collision handlers again
        this.loadCurrentLevel(false);
        
        // Update total coins for the reset level
        this.totalCoins = this.coins.length;
        
        // Reset completion flag but keep current score and level
        this.isLevelCompleting = false;
        
        // Resume game after a brief pause to allow everything to settle
        setTimeout(() => {
            this.isGameRunning = wasRunning;
        }, 50); // 50ms pause
        
        console.log(`Level ${this.currentLevel} reset! Player at: (${this.player.x}, ${this.player.y}), Score: ${this.score}`);
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
        
        this.logPlayerIntersections();

        // Update cooldowns
        this.updateCooldowns(deltaTime);
        
        // Update player physics
        this.player.update(deltaTime);
        
        // Update all coins for animation
        for (const coin of this.coins) {
            coin.update(deltaTime);
        }
        
        // Update all enemies
        for (const enemy of this.enemies) {
            enemy.update(deltaTime);
        }
        
        // Update all frozen clones
        for (const frozenClone of this.frozenClones) {
            frozenClone.update(deltaTime);
        }
        
        // Check collisions
        this.collisionEngine.checkCollisions();
        
        // Round player position to avoid fractional pixels after collision resolution
        this.player.roundPosition();
        
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
        
        // Create frozen clone with destruction callback
        const frozenClone = new FrozenClone(
            Math.round(playerPosition.x), 
            Math.round(playerPosition.y), 
            this.player.width, 
            this.player.height,
            (clone) => this.removeFrozenClone(clone) // Destruction callback
        );
        
        frozenClone.boundsEnabled = false; 
        this.frozenClones.push(frozenClone);
        this.collisionEngine.register(frozenClone);
        //register the frozen clone with the collision engine after 150ms
        setTimeout(() => {
            frozenClone.boundsEnabled = true; // Enable bounds after grace period
        }, 600); 

        return true;
    }

    /**
     * Remove a frozen clone from the game
     * @param {FrozenClone} clone - The clone to remove
     */
    removeFrozenClone(clone) {
        // Unregister from collision engine
        this.collisionEngine.unregister(clone);
        
        // Remove from frozen clones array
        this.frozenClones = this.frozenClones.filter(c => c !== clone);
        
        console.log(`Frozen clone destroyed. Remaining clones: ${this.frozenClones.length}`);
    }

    /**
     * Remove the oldest frozen clone from the game
     */
    removeOldestFrozenClone() {
        if (this.frozenClones.length > 0) {
            const oldestClone = this.frozenClones[0]; // First clone in array is oldest
            
            // Play VFX animation before removing
            oldestClone.vfxAlpha = 255;
            oldestClone.setAnimationEnabled(true, 3); // Play animation once
            
            // Update animation callback to handle removal after animation
            oldestClone.animationLoopCallback = () => {
                oldestClone.vfxAlpha = 0;
                oldestClone.setAnimationEnabled(false);
                
                // Remove the clone after animation completes
                this.removeFrozenClone(oldestClone);
                console.log(`Oldest frozen clone removed with VFX. Remaining clones: ${this.frozenClones.length}`);
            };
            
            console.log(`Playing VFX animation for oldest clone removal...`);
        } else {
            console.log('No frozen clones to remove');
        }
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
     * Get all frozen clones
     * @returns {Array} Array of frozen clone objects
     */
    getFrozenClones() {
        return this.frozenClones;
    }

    /**
     * Update viewport bounds for culling based on camera offset
     * @param {number} cameraOffsetX - Camera X offset
     * @param {number} cameraOffsetY - Camera Y offset
     */
    updateViewport(cameraOffsetX, cameraOffsetY) {
        this.viewport.left = -cameraOffsetX - this.viewport.buffer;
        this.viewport.right = -cameraOffsetX + this.canvasWidth + this.viewport.buffer;
        this.viewport.top = -cameraOffsetY - this.viewport.buffer;
        this.viewport.bottom = -cameraOffsetY + this.canvasHeight + this.viewport.buffer;
    }

    /**
     * Get current viewport bounds for culling
     * @returns {Object} Viewport bounds {left, right, top, bottom, buffer}
     */
    getViewport() {
        return this.viewport;
    }

    /**
     * Check if an entity is within the viewport (for culling)
     * @param {Object} entity - Entity with x, y, width, height properties
     * @returns {boolean} True if entity intersects with viewport
     */
    isEntityInViewport(entity) {
        return (
            entity.x < this.viewport.right &&
            entity.x + entity.width > this.viewport.left &&
            entity.y < this.viewport.bottom &&
            entity.y + entity.height > this.viewport.top
        );
    }

    /**
     * Check and log if player is intersecting with any entities
     * @returns {Array} Array of entity types the player is intersecting with
     */
    logPlayerIntersections() {
        const intersections = [];
        const playerBox = this.player.bounds.getCollisionBox(this.player);

        // Check intersections with platforms
        for (const platform of this.platforms) {
            const platformBox = platform.bounds.getCollisionBox(platform);
            if (this.isBoxIntersecting(playerBox, platformBox)) {
                intersections.push('Platform');
            }
        }

        // Check intersections with enemies
        for (const enemy of this.enemies) {
            const enemyBox = enemy.bounds.getCollisionBox(enemy);
            if (this.isBoxIntersecting(playerBox, enemyBox)) {
                intersections.push('Enemy');
            }
        }

        // Check intersections with frozen clones
        for (const frozenClone of this.frozenClones) {
            if (!frozenClone.boundsEnabled) continue; // Skip if bounds are not enabled
            const cloneBox = frozenClone.bounds.getCollisionBox(frozenClone);
            if (this.isBoxIntersecting(playerBox, cloneBox)) {
                intersections.push('FrozenClone');
            }
        }

        // Log results
        if (intersections.length > 0) {
            console.log(`Player intersecting with: ${intersections.join(', ')}`);
            // move player toward the first anchor
            const firstAnchor = this.anchors[0];
            if (firstAnchor) {
                const dx = firstAnchor.x - this.player.x;
                const dy = firstAnchor.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Move player towards anchor if not already there
                if (distance > 0) {
                    const moveSpeed = 25; // Pixels per second
                    this.player.x += (dx / distance) * moveSpeed * (deltaTime / 1000);
                    this.player.y += (dy / distance) * moveSpeed * (deltaTime / 1000);
                }
            }
        } else {
            //console.log('Player not intersecting with any entities');
        }

        return intersections;
    }

    /**
     * Check if two bounding boxes are intersecting
     * @param {Object} box1 - First bounding box {x, y, width, height}
     * @param {Object} box2 - Second bounding box {x, y, width, height}
     * @returns {boolean} True if boxes intersect
     */
    isBoxIntersecting(box1, box2) {
        return box1.x < box2.x + box2.width &&
               box1.x + box1.width > box2.x &&
               box1.y < box2.y + box2.height &&
               box1.y + box1.height > box2.y;
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
     * Get all anchors
     * @returns {Array} Array of anchor objects
     */
    getAnchors() {
        return this.anchors;
    }

    /**
     * Get current placement cooldown
     * @returns {number} Placement cooldown in milliseconds
     */
    getPlaceCooldown() {
        return this.placeCooldown;
    }

    /**
     * Get total placement cooldown time
     * @returns {number} Total placement cooldown time in milliseconds
     */
    getPlaceCooldownTime() {
        return this.placeCooldownTime;
    }

    /**
     * Get current level number
     * @returns {number} Current level number
     */
    getCurrentLevel() {
        return this.currentLevel;
    }

    /**
     * Get maximum level number
     * @returns {number} Maximum level number
     */
    getMaxLevel() {
        return this.maxLevel;
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

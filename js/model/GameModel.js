import { Player } from './entities/Player.js';
import { Coin } from './entities/Coin.js';
import { Enemy } from './entities/Enemy.js';
import { Platform } from './entities/Platform.js';
import { FrozenClone } from './entities/FrozenClone.js';
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
        this.frozenClones = [];
        this.isGameRunning = true;
        this.collisionEngine = new CollisionEngine();
        this.score = 0;
        
        // Place action cooldown
        this.placeCooldown = 0;
        this.placeCooldownTime = 1000; // 1 second in milliseconds
    }

    /**
     * Initialize the game
     */
    init() {
        const LEVEL_STRING = `

                                #########################################
                                #.......................................#
                                #.......................................#
                                #.......................................#
                                #.......................................#
                                #................C..............C.......#
                                #.......................................#
                                #.........................###...........#
                                #......................................##
                                #.......................................#
                                #...................................C...#
                                #.............C.....C.....C.............#
                                #.......................................#
                                #.........C......................########
                                #...,........###.................#
                                #................................#
                                #.......P........................#
                                ##################################
                                ................`;
        //split the level string into lines and filter out tabs and spaces
        const lines = LEVEL_STRING.trim().split('\n').map(line => line.replace(/\t/g, '').replace(/ /g, ''));
        const tileSize = 50;
        const entities = {
            player: null,
            platforms: [],
            coins: [],
            enemies: []
        };


        lines.forEach((line, y) => {
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                const worldX = x * tileSize;
                const worldY = y * tileSize;
                
                switch(char) {
                    case 'P':
                        entities.player = { x: worldX, y: worldY };
                        break;
                    case '#':
                        entities.platforms.push({ 
                            x: worldX, y: worldY, 
                            width: tileSize, height: tileSize 
                        });
                        break;
                    case 'C':
                        entities.coins.push({ x: worldX, y: worldY });
                        break;
                    case 'E':
                        entities.enemies.push({ x: worldX, y: worldY });
                        break;
                }
            }
        }) 

        
        // Merge adjacent horizontal platforms
        const mergedPlatforms = [];
        // Sort platforms by y, then x
        const sorted = entities.platforms.slice().sort((a, b) => {
            if (a.y === b.y) return a.x - b.x;
            return a.y - b.y;
        });

        let i = 0;
        while (i < sorted.length) {
            let current = sorted[i];
            let merged = { ...current };
            let j = i + 1;
            while (
            j < sorted.length &&
            sorted[j].y === current.y &&
            sorted[j].x === merged.x + merged.width
            ) {
            // Extend width
            merged.width += sorted[j].width;
            j++;
            }
            mergedPlatforms.push(merged);
            i = j;
        }
        entities.platforms = mergedPlatforms;


        // Merge adjacent vertical platforms
        const verticallyMergedPlatforms = [];
        // Sort platforms by x, then y
        const vSorted = entities.platforms.slice().sort((a, b) => {
            if (a.x === b.x) return a.y - b.y;
            return a.x - b.x;
        });

        let vi = 0;
        while (vi < vSorted.length) {
            let current = vSorted[vi];
            let merged = { ...current };
            let vj = vi + 1;
            while (
                vj < vSorted.length &&
                vSorted[vj].x === current.x &&
                vSorted[vj].width === current.width && // Must have same width
                vSorted[vj].y === merged.y + merged.height
            ) {
                // Extend height
                merged.height += vSorted[vj].height;
                vj++;
            }
            verticallyMergedPlatforms.push(merged);
            vi = vj;
        }
        entities.platforms = verticallyMergedPlatforms;


        entities.platforms.forEach(p => {
            this.platforms.push(new Platform(p.x, p.y, p.width, p.height));
        });
        entities.coins.forEach(c => {
            this.coins.push(new Coin(c.x, c.y));
        });
        entities.enemies.forEach(e => {
            this.enemies.push(new Enemy(e.x, e.y));
        });
        if (entities.player) {
            this.player.setPosition(entities.player.x, entities.player.y);
        }
        this.score = 0;
        this.isGameRunning = true;
        //this.coins.push(new Coin(300, 200)); // Example coin
        //this.coins.push(new Coin(500, 400)); // Example coin

        //this.enemies.push(new Enemy(200, 100)); // Example enemy
        //this.enemies.push(new Enemy(600, 300)); // Example enemy

        //this.platforms.push(new Platform(0, 550, 800, 20)); // Ground platform
        
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
            if (entity instanceof FrozenClone) {
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
        const frozenClone = new FrozenClone(Math.round(playerPosition.x), Math.round(playerPosition.y), playerCollisionBox.width, playerCollisionBox.height);
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

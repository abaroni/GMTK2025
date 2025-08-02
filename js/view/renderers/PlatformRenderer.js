/**
 * PlatformRenderer - Handles tile-based rendering of platforms using sprite assets
 */
export class PlatformRenderer {
    constructor(tileSheet, tileSize = 50) {
        this.tileSheet = tileSheet;
        this.tileSize = tileSize; // Should match LevelParser tileSize
        
        // Define tile types in sprite sheet (16x16 tiles in the sheet)
        this.tileSprites = {
            // Single isolated tile
            SINGLE: { x: 0, y: 0 },
            
            // Horizontal line tiles
            LEFT_EDGE: { x: 16*14, y: 16*0 },     // Left end of horizontal line
            MIDDLE: { x: 16*15, y: 16*0 },        // Middle section
            RIGHT_EDGE: {  x: 16*16, y: 16*0 },    // Right end of horizontal line
            
            // Vertical line tiles
            TOP_CAP: { x: 16*14, y: 16*1 },       // Top end of vertical line
            VERTICAL_MIDDLE: { x: 16*15, y: 16*1 }, // Middle of vertical line
            BOTTOM_CAP: { x: 16*16, y: 16*1 },    // Bottom end of vertical line
            
            // Rectangle corner tiles
            TOP_LEFT: { x: 16*11, y: 16*1 },      // Top-left corner
            TOP_RIGHT: { x: 16*10, y: 16*1 },    // Top-right corner
            BOTTOM_LEFT: { x: 16*11, y: 16*0 },  // Bottom-left corner
            BOTTOM_RIGHT: { x: 16*10, y: 16*0 }, // Bottom-right corner
            
            // Rectangle edge tiles
            TOP_EDGE: { x: 16*7, y: 16*1 },      // Top edge (middle)
            BOTTOM_EDGE: { x: 16*6, y: 16*0 },  // Bottom edge (middle)
            LEFT_SIDE: { x: 16*7, y: 16*0 },    // Left edge (middle)
            RIGHT_SIDE: { x: 16*6, y: 16*1 },   // Right edge (middle)
            
            // Fill tile for interior
            FILL: {x: 16*13, y: 16*2 }           // Interior fill
        };
    }
    
    /**
     * Draw a platform using tile-based rendering
     * @param {Object} platform - Platform object with x, y, width, height
     * @param {Array} allPlatforms - Array of all platforms for adjacency checking
     */
    drawPlatform(platform, allPlatforms = []) {
        const tilesX = Math.round(platform.width / this.tileSize);
        const tilesY = Math.round(platform.height / this.tileSize);
        
        // Draw each tile position
        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                const worldX = platform.x + tileX * this.tileSize;
                const worldY = platform.y + tileY * this.tileSize;

                let tileType;
                
                // Check if this is a one-way-up platform
                if (platform.collisionType === 'one-way-up') {
                    // One-way-up platforms always use MIDDLE tile
                    tileType = 'TOP_EDGE';
                } else {
                    // Regular platforms use adjacency-based tile selection
                    tileType = this.getTileType(worldX, worldY, allPlatforms);
                }
                
                const sprite = this.tileSprites[tileType];
                
                // Draw the tile
                image(
                    this.tileSheet,
                    worldX,
                    worldY,
                    this.tileSize,
                    this.tileSize,
                    sprite.x, sprite.y, 16, 16
                );
            }
        }
    }
    
    /**
     * Determine the tile type based on adjacent tiles
     * @param {number} worldX - World X position of the tile
     * @param {number} worldY - World Y position of the tile
     * @param {Array} allPlatforms - Array of all platforms to check adjacency
     * @returns {string} Tile type key
     */
    getTileType(worldX, worldY, allPlatforms) {
        // Check for adjacent tiles in 8 directions
        const hasLeft = this.hasTileAt(worldX - this.tileSize, worldY, allPlatforms);
        const hasRight = this.hasTileAt(worldX + this.tileSize, worldY, allPlatforms);
        const hasTop = this.hasTileAt(worldX, worldY - this.tileSize, allPlatforms);
        const hasBottom = this.hasTileAt(worldX, worldY + this.tileSize, allPlatforms);
        
        // Check diagonal neighbors for more complex tile selection
        const hasTopLeft = this.hasTileAt(worldX - this.tileSize, worldY - this.tileSize, allPlatforms);
        const hasTopRight = this.hasTileAt(worldX + this.tileSize, worldY - this.tileSize, allPlatforms);
        const hasBottomLeft = this.hasTileAt(worldX - this.tileSize, worldY + this.tileSize, allPlatforms);
        const hasBottomRight = this.hasTileAt(worldX + this.tileSize, worldY + this.tileSize, allPlatforms);
        
        // Determine tile type based on adjacent tiles
        
        // Single isolated tile
        if (!hasLeft && !hasRight && !hasTop && !hasBottom) {
            return 'SINGLE';
        }
        
        // Corner tiles (check if tile is at a corner)
        if (!hasLeft && !hasTop && hasRight && hasBottom) {
            return 'TOP_LEFT';
        }
        if (!hasRight && !hasTop && hasLeft && hasBottom) {
            return 'TOP_RIGHT';
        }
        if (!hasLeft && !hasBottom && hasRight && hasTop) {
            return 'BOTTOM_LEFT';
        }
        if (!hasRight && !hasBottom && hasLeft && hasTop) {
            return 'BOTTOM_RIGHT';
        }
        
        // Edge tiles
        if (!hasTop && (hasLeft || hasRight) && hasBottom) {
            return 'TOP_EDGE';
        }
        if (!hasBottom && (hasLeft || hasRight) && hasTop) {
            return 'BOTTOM_EDGE';
        }
        if (!hasLeft && (hasTop || hasBottom) && hasRight) {
            return 'LEFT_SIDE';
        }
        if (!hasRight && (hasTop || hasBottom) && hasLeft) {
            return 'RIGHT_SIDE';
        }
        
        // Special cases for lines
        if (hasLeft && hasRight && !hasTop && !hasBottom) {
            return 'MIDDLE'; // Horizontal line
        }
        if (!hasLeft && hasRight && !hasTop && !hasBottom) {
            return 'LEFT_EDGE'; // Start of horizontal line
        }
        if (hasLeft && !hasRight && !hasTop && !hasBottom) {
            return 'RIGHT_EDGE'; // End of horizontal line
        }
        
        // Vertical line cases
        if (hasTop && hasBottom && !hasLeft && !hasRight) {
            return 'VERTICAL_MIDDLE'; // Middle of vertical line
        }
        if (!hasTop && hasBottom && !hasLeft && !hasRight) {
            return 'TOP_CAP'; // Start of vertical line (top cap)
        }
        if (hasTop && !hasBottom && !hasLeft && !hasRight) {
            return 'BOTTOM_CAP'; // End of vertical line (bottom cap)
        }
        
        // Default to fill for interior tiles
        return 'FILL';
    }
    
    /**
     * Check if there's a tile at the given world position
     * @param {number} worldX - World X coordinate to check
     * @param {number} worldY - World Y coordinate to check
     * @param {Array} allPlatforms - Array of all platforms
     * @returns {boolean} True if there's a tile at this position
     */
    hasTileAt(worldX, worldY, allPlatforms) {
        for (const platform of allPlatforms) {
            // Check if the point is within this platform's bounds
            if (worldX >= platform.x && 
                worldX < platform.x + platform.width &&
                worldY >= platform.y && 
                worldY < platform.y + platform.height) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Update tile size (useful for matching LevelParser tileSize)
     * @param {number} newTileSize - New tile size in pixels
     */
    setTileSize(newTileSize) {
        this.tileSize = newTileSize;
    }
    
    /**
     * Update sprite sheet reference
     * @param {p5.Image} newTileSheet - New sprite sheet image
     */
    setTileSheet(newTileSheet) {
        this.tileSheet = newTileSheet;
    }
}

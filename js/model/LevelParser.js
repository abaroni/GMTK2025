/**
 * LevelParser - Handles parsing text-based level definitions into game entities
 */
export class LevelParser {
    constructor() {
        this.tileSize = 50;
        this.tileMap = {
            '.': 'empty',
            '#': 'platform',
            'C': 'coin',
            'E': 'enemy',
            'P': 'player'
        };
    }

    /**
     * Parse a level string into entity data
     * @param {string} levelString - Text representation of the level
     * @returns {Object} Parsed level data with entities
     */
    parseLevel(levelString) {
        // Clean the level string - remove tabs and spaces
        const lines = levelString.trim().split('\n').map(line => 
            line.replace(/\t/g, '').replace(/ /g, '')
        );

        const entities = {
            player: null,
            platforms: [],
            coins: [],
            enemies: []
        };

        // Parse each character in the level string
        lines.forEach((line, y) => {
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                const worldX = x * this.tileSize;
                const worldY = y * this.tileSize;
                
                switch(char) {
                    case 'P':
                        entities.player = { x: worldX, y: worldY };
                        break;
                    case '#':
                        entities.platforms.push({ 
                            x: worldX, y: worldY, 
                            width: this.tileSize, height: this.tileSize 
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
        });

        // Merge adjacent platforms for better performance
        entities.platforms = this.mergePlatforms(entities.platforms);

        return entities;
    }

    /**
     * Merge adjacent platforms to reduce the number of collision objects
     * @param {Array} platforms - Array of platform objects
     * @returns {Array} Array of merged platform objects
     */
    mergePlatforms(platforms) {
        // First, merge horizontally adjacent platforms
        const horizontallyMerged = this.mergeHorizontalPlatforms(platforms);
        
        // Then, merge vertically adjacent platforms
        const fullyMerged = this.mergeVerticalPlatforms(horizontallyMerged);
        
        return fullyMerged;
    }

    /**
     * Merge horizontally adjacent platforms
     * @param {Array} platforms - Array of platform objects
     * @returns {Array} Array of horizontally merged platforms
     */
    mergeHorizontalPlatforms(platforms) {
        const mergedPlatforms = [];
        
        // Sort platforms by y, then x
        const sorted = platforms.slice().sort((a, b) => {
            if (a.y === b.y) return a.x - b.x;
            return a.y - b.y;
        });

        let i = 0;
        while (i < sorted.length) {
            let current = sorted[i];
            let merged = { ...current };
            let j = i + 1;
            
            // Merge consecutive platforms on the same row
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
        
        return mergedPlatforms;
    }

    /**
     * Merge vertically adjacent platforms
     * @param {Array} platforms - Array of platform objects
     * @returns {Array} Array of vertically merged platforms
     */
    mergeVerticalPlatforms(platforms) {
        const verticallyMergedPlatforms = [];
        
        // Sort platforms by x, then y
        const vSorted = platforms.slice().sort((a, b) => {
            if (a.x === b.x) return a.y - b.y;
            return a.x - b.x;
        });

        let vi = 0;
        while (vi < vSorted.length) {
            let current = vSorted[vi];
            let merged = { ...current };
            let vj = vi + 1;
            
            // Merge consecutive platforms in the same column
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
        
        return verticallyMergedPlatforms;
    }

    /**
     * Get the default level string
     * @returns {string} Default level layout
     */
    getDefaultLevel() {
        return `
                                #########################################
                                #.......................................#
                                #.......................................#
                                #.......................................#
                                #.......................................#
                                #................C..............C.......#
                                #.......................................#
                                #.........................###...........#
                                #......................................##
                                #...###.................................#
                                #...###.............................C...#
                                #...###.......C.....C.....C.............#
                                #.......................................#
                                #.........C......................########
                                #............###.................#.......
                                #................................#.......
                                #.......P........................#.......
                                ##################################.......
                                ........###..............................
                                ........###..............................`;
    }
}

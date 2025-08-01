/**
 * Level Definitions - Contains all level layout definitions
 */
export class LevelDefinitions {
    constructor(levelParser) {
        this.levelParser = levelParser;
        this.maxLevel = 3;
    }

    /**
     * Get the maximum number of levels
     * @returns {number} Maximum level number
     */
    getMaxLevel() {
        return this.maxLevel;
    }

    /**
     * Get a level definition by number
     * @param {number} levelNumber - Level number (1-based)
     * @returns {string} Level definition string
     */
    getLevel(levelNumber) {
        switch (levelNumber) {
            case 1:
                return this.getLevel1();
            case 2:
                return this.getLevel2();
            case 3:
                return this.getLevel3();
            default:
                console.warn(`Level ${levelNumber} not found, returning level 1`);
                return this.getLevel1();
        }
    }

    /**
     * Get all level definitions
     * @returns {Object} Object containing all level definitions
     */
    getAllLevels() {
        const levels = {};
        for (let i = 1; i <= this.maxLevel; i++) {
            levels[i] = this.getLevel(i);
        }
        return levels;
    }

    /**
     * Get level 1 definition
     * @returns {string} Level 1 string
     */
    getLevel1() {
        return `
####################################
####################################
####################################
####################################
####################################
####################################
####################################
##########................##########
##########................##########
##########................##########
##########................##########
##########................##########
##########................##########
##########................##########
##########....C.####......##########
##########......####......##########
##########......####....C.##########
##########..P...####......##########
####################################
####################################
####################################
####################################
####################################
####################################
####################################
        `.trim();
    }

    /**
     * Get level 2 definition
     * @returns {string} Level 2 string
     */
    getLevel2() {
        return `
####################################
####################################
####################################
####################################
####################################
####################################
####################################
##########.......C........##########
##########................##########
##########................##########
##########................##########
##########................##########
##########................##########
##########................##########
##########......####......##########
##########......####......##########
##########......####......##########
##########..P...####......##########
####################################
####################################
####################################
####################################
####################################
####################################
####################################
        `.trim();
    }

    /**
     * Get level 3 definition (uses default from LevelParser)
     * @returns {string} Level 3 string
     */
    getLevel3() {
        return this.levelParser.getDefaultLevel();
    }
}

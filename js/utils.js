/**
 * Utility functions for mathematical operations and common game calculations
 */
export class Utils {
    /**
     * Smooth interpolation using smoothstep function for ease-in-out behavior
     * Provides smooth acceleration at the beginning and deceleration at the end
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {number} Interpolated value
     */
    static smoothstep(current, target, factor) {
        const distance = target - current;
        const normalizedDistance = Math.abs(distance);
        
        // If we're very close, just snap to target to avoid infinite micro-movements
        if (normalizedDistance < 0.01) {
            return target;
        }
        
        // Use smoothstep for ease-in-out interpolation
        // smoothstep(t) = t * t * (3 - 2 * t)
        const smoothFactor = factor * factor * (3 - 2 * factor);
        
        return current + distance * smoothFactor;
    }

    /**
     * Custom easing interpolation with separate control over initial and final smoothness
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} factor - Interpolation factor (0-1)
     * @param {number} easeIn - Ease-in strength (0 = linear start, 1+ = smooth start, 2+ = very smooth start)
     * @param {number} easeOut - Ease-out strength (0 = linear end, 1+ = smooth end, 2+ = very smooth end)
     * @returns {number} Interpolated value
     */
    static customEase(current, target, factor, easeIn = 1, easeOut = 1) {
        const distance = target - current;
        const normalizedDistance = Math.abs(distance);
        
        // If we're very close, just snap to target to avoid infinite micro-movements
        if (normalizedDistance < 0.01) {
            return target;
        }
        
        // Clamp factor to [0, 1]
        const t = Math.max(0, Math.min(1, factor));
        
        // Apply ease-in (affects beginning of curve)
        let easedT = t;
        if (easeIn > 0) {
            easedT = Math.pow(t, easeIn + 1);
        }
        
        // Apply ease-out (affects end of curve)
        if (easeOut > 0) {
            // Convert to ease-out by flipping, applying ease-in, then flipping back
            easedT = 1 - Math.pow(1 - easedT, easeOut + 1);
        }
        
        return current + distance * easedT;
    }

    /**
     * Bezier-based easing with control points for precise curve control
     * @param {number} current - Current value
     * @param {number} target - Target value
     * @param {number} factor - Interpolation factor (0-1)
     * @param {number} cp1 - First control point (0-1, controls ease-in curve)
     * @param {number} cp2 - Second control point (0-1, controls ease-out curve)
     * @returns {number} Interpolated value
     */
    static bezierEase(current, target, factor, cp1 = 0.25, cp2 = 0.75) {
        const distance = target - current;
        const normalizedDistance = Math.abs(distance);
        
        // If we're very close, just snap to target to avoid infinite micro-movements
        if (normalizedDistance < 0.01) {
            return target;
        }
        
        // Clamp factor to [0, 1]
        const t = Math.max(0, Math.min(1, factor));
        
        // Cubic Bezier curve: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
        // For easing, P₀ = (0,0), P₁ = (cp1, 0), P₂ = (cp2, 1), P₃ = (1,1)
        // We only need the Y component for the easing value
        const oneMinusT = 1 - t;
        const bezierY = 3 * oneMinusT * oneMinusT * t * 0 + // P₁ contribution (Y=0)
                       3 * oneMinusT * t * t * 1 + // P₂ contribution (Y=1)
                       t * t * t * 1; // P₃ contribution (Y=1)
        
        return current + distance * bezierY;
    }

    
}

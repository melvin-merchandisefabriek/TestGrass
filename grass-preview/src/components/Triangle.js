import React from 'react';

/**
 * Class representing a Triangle component
 */
class Triangle {
    /**
     * Create a triangle
     * @param {number} x - The x position of the triangle
     * @param {number} y - The y position of the triangle
     * @param {number} width - The width of the triangle
     * @param {number} height - The height of the triangle
     * @param {number} rotation - The rotation of the triangle in degrees
     */
    constructor(x, y, width, height, rotation = 0, powerFactor = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        // Store power factor (0-1) instead of binary isCharged
        this.powerFactor = powerFactor;
        this.points = this.calculatePoints();
        
        // Calculate the effective size for collision detection
        this.effectiveSize = Math.max(width, height);
    }

    /**
     * Calculate triangle points based on position, dimensions and rotation
     * @param {boolean} includeTrail - Whether to include trail points for visual effects
     * @returns {Array} Array of points {x, y}
     */
    calculatePoints(includeTrail = false) {
        // Base triangle points (centered at origin)
        const points = [
            { x: 0, y: -this.height/2 },          // Top point
            { x: this.width/2, y: this.height/2 }, // Bottom right
            { x: -this.width/2, y: this.height/2 } // Bottom left
        ];
        
        // Rotate points
        const radians = (this.rotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        
        // Apply rotation and translation
        const transformedPoints = points.map(p => ({
            x: (p.x * cos - p.y * sin) + this.x,
            y: (p.x * sin + p.y * cos) + this.y
        }));
        
        // Add trail effect based on power factor - more powerful shots get more trail
        if (includeTrail && this.powerFactor > 0.4) {
            // Add additional points to create motion blur/trail effect
            // These won't be used for collision, just for visual effects
            const trailPoints = [];
            
            // Trail effect scales with power factor
            const trailLength = Math.ceil(2 + this.powerFactor * 2); // 3-4 segments based on power
            const trailOffset = -4 - this.powerFactor * 2; // Further offset for more powerful shots
            
            for (let i = 1; i <= trailLength; i++) {
                // Scale trail opacity by position (further back = more transparent)
                // More powerful shots have more visible trails
                const trailOpacity = (1 - (i / (trailLength + 1))) * Math.min(1, this.powerFactor + 0.3);
                
                // Each segment is further back and slightly smaller
                const xOffset = trailOffset * i * cos;
                const yOffset = trailOffset * i * sin;
                
                // Add trail segment with position and opacity info
                trailPoints.push({
                    points: transformedPoints.map(p => ({
                        x: p.x + xOffset,
                        y: p.y + yOffset
                    })),
                    opacity: trailOpacity
                });
            }
            
            // Add trail data to the result
            transformedPoints.trail = trailPoints;
        }
        
        return transformedPoints;
    }

    /**
     * Update the triangle's position
     * @param {number} x - New x position
     * @param {number} y - New y position
     * @param {number} rotation - New rotation angle (optional)
     */
    updatePosition(x, y, rotation = null) {
        this.x = x;
        this.y = y;
        if (rotation !== null) {
            this.rotation = rotation;
        }
        this.points = this.calculatePoints();
        
        // If we're a powerful triangle, create a motion blur effect
        // Scale motion blur with power factor - more powerful = more blur
        if (this.powerFactor > 0.4) {
            // The full trail will be calculated during rendering
            this.hasMotionBlur = true;
            this.motionBlurIntensity = this.powerFactor; // Store intensity for rendering
        }
        
        return this;
    }

    /**
     * Get SVG polygon points attribute string
     * @returns {string} SVG points attribute value
     */
    getPointsString() {
        return this.points.map(p => `${p.x},${p.y}`).join(" ");
    }
}

export default Triangle;

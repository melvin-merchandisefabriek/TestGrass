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
    constructor(x, y, width, height, rotation = 0) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = rotation;
        this.points = this.calculatePoints();
    }

    /**
     * Calculate triangle points based on position, dimensions and rotation
     * @returns {Array} Array of points {x, y}
     */
    calculatePoints() {
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
        return points.map(p => ({
            x: (p.x * cos - p.y * sin) + this.x,
            y: (p.x * sin + p.y * cos) + this.y
        }));
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
        return this;
    }

    /**
     * Get SVG polygon points attribute string
     * @returns {string} SVG points attribute value
     */
    getPointsString() {
        return this.points.map(p => `${p.x},${p.y}`).join(" ");
    }

    /**
     * Get the SVG points string for rendering
     * @returns {string} SVG points attribute string
     */
    getPointsString() {
        return this.points.map(p => `${p.x},${p.y}`).join(" ");
    }
}

export default Triangle;

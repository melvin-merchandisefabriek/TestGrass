import React from 'react';
import { getPointOnQuadraticCurve, Constants } from '../utils/Utils';
import Triangle from './Triangle';

/**
 * Class representing a Path with animated triangle
 */
class Path {
    /**
     * Create a new path
     * @param {number} startX - Start x position
     * @param {number} startY - Start y position
     * @param {number} endX - End x position
     * @param {number} endY - End y position
     * @param {number} radius - Circle radius at time of firing
     */
    constructor(startX, startY, endX, endY, radius) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.startX = startX;
        this.startY = startY;
        this.endX = endX;
        this.endY = endY;
        this.radius = radius;
        this.timestamp = Date.now();
        this.opacity = Constants.PATH_DEFAULT_OPACITY;
        this.progress = 0;
        
        // Calculate path parameters
        this.calculatePathParameters();
        
        // Calculate triangle height based on inverse relationship with circle radius
        // When radius is small, triangle height should be larger
        const radiusRatio = 1-this.radius/Constants.MOUSE_CIRCLE_RADIUS;
        const triangleHeight =  radiusRatio * Constants.TRIANGLE_HEIGHT_SCALE_FACTOR * 5 + 10
        
        // Create triangle with calculated height
        this.triangle = new Triangle(startX, startY, Constants.TRIANGLE_WIDTH, triangleHeight, 0);
    }

    /**
     * Calculate the path parameters for the bezier curve
     */
    calculatePathParameters() {
        const dx = this.endX - this.startX;
        const dy = this.endY - this.startY;
        this.distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate the arc height based on distance
        this.arcHeight = Math.min(
            this.distance * Constants.GRAVITY, 
            400 * (this.radius / Constants.MOUSE_CIRCLE_RADIUS + 0.5) // look at later, not yet good enough
        );
        
        // Calculate control point
        this.controlPointX = this.startX + dx / 2;
        this.controlPointY = this.startY - this.arcHeight;
        
        // Generate SVG path
        this.svgPath = this.getBezierPath();
    }

    /**
     * Get the SVG path string for the bezier curve
     * @returns {string} SVG path data attribute value
     */
    getBezierPath() {
        return `M ${this.startX},${this.startY} Q ${this.controlPointX},${this.controlPointY} ${this.endX},${this.endY}`;
    }

    /**
     * Update the path animation progress
     * @param {number} elapsed - Elapsed time since animation start
     * @returns {boolean} True if animation is still active, false if complete
     */
    update(now) {
        const animDuration = Constants.PATH_BASE_DURATION * (this.radius / 2 + 2.5);
        
        const age = now - this.timestamp;
        
        // Animation complete
        if (age >= animDuration) {
            return false;
        }
        
        // Update opacity and progress
        this.opacity = Constants.PATH_DEFAULT_OPACITY * (1 - age / animDuration);
        this.progress = Math.min(age / animDuration, 1);
        
        // Update triangle position
        this.updateTrianglePosition();
        
        return true;
    }

    /**
     * Update the triangle position along the path
     */
    updateTrianglePosition() {
        // Calculate the position of the triangle along the curve
        const trianglePos = getPointOnQuadraticCurve(
            this.startX, this.startY, 
            this.controlPointX, this.controlPointY, 
            this.endX, this.endY, 
            this.progress
        );
        
        // Get the tangent to the curve at this point to determine rotation
        const nextPoint = getPointOnQuadraticCurve(
            this.startX, this.startY, 
            this.controlPointX, this.controlPointY, 
            this.endX, this.endY, 
            Math.min(this.progress + 0.01, 1)
        );
        
        // Calculate angle based on direction
        const angle = Math.atan2(
            nextPoint.y - trianglePos.y, 
            nextPoint.x - trianglePos.x
        ) * (180 / Math.PI);
        
        // Update triangle position and rotation
        this.triangle.updatePosition(trianglePos.x, trianglePos.y, angle + 90);
    }

    /**
     * Get SVG elements for rendering
     * @returns {Object} Object with SVG elements
     */
    getElements() {
        // Get the triangle points for rendering
        const trianglePoints = this.triangle.getPointsString();
        
        return {
            pathElement: (
                <path
                    key={`path-${this.id}`}
                    d={this.svgPath}
                    fill="none"
                    stroke={Constants.PATH_STROKE_COLOR}
                    strokeWidth={Constants.PATH_STROKE_WIDTH}
                    opacity={this.opacity * Constants.PATH_OPACITY}
                />
            ),
            triangleElement: (
                <polygon
                    key={`triangle-${this.id}`}
                    points={trianglePoints}
                    fill={Constants.MOVING_TRIANGLE_FILL}
                    stroke="none"
                    opacity={Constants.MOVING_TRIANGLE_OPACITY}
                />
            )
        };
    }
}

export default Path;

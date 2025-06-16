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
        
        // Calculate triangle height with inverse relationship to circle radius
        // When mouse circle is small (mouse held down), triangle gets larger
        const radiusRatio = 1 - this.radius/Constants.MOUSE_CIRCLE_RADIUS;
        
        // Triangle height scales more dramatically with radius
        // Min radius = largest triangle, max radius = smallest triangle
        const triangleHeight = 10 + radiusRatio * Constants.TRIANGLE_HEIGHT_SCALE_FACTOR * 5;
        
        // Width also scales with holding down the mouse but less dramatically
        const triangleWidth = Constants.TRIANGLE_WIDTH * (1 + radiusRatio * 0.5);
        
        // Store the power factor (0.0 - 1.0) based on how much the mouse was held
        // This will determine damage dealing capability
        this.powerFactor = radiusRatio;
        
        // Create triangle with calculated dimensions - no more binary "charged" concept
        this.triangle = new Triangle(
            startX, 
            startY, 
            triangleWidth,
            triangleHeight, 
            0,
            this.powerFactor // Pass power factor instead of isCharged boolean
        );
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
        // Calculate animation duration based on radius
        // For both small and large triangles, we'll use a consistent speed
        // This keeps projectile speed consistent as requested
        
        // Calculate the charge ratio (0 to 1) where 1 is fully charged
        const chargeRatio = this.radius / Constants.MOUSE_CIRCLE_RADIUS;
        
        // Consistent animation duration for all triangle sizes
        // We'll maintain the animation duration across all triangle sizes
        // This ensures projectile speed is consistent
        const animDuration = Constants.PATH_BASE_DURATION;
        
        // Add a small delay before considering the animation complete
        // This allows triangles to travel slightly past their endpoint
        const extendedFactor = 1.2;
        const extendedDuration = animDuration * extendedFactor;
        
        const age = now - this.timestamp;
        
        // Animation complete - with extended duration for better collision detection
        if (age >= extendedDuration) {
            return false;
        }
        
        // Calculate progress - allow overshooting up to 10-20% depending on charge
        // Normal progress goes from 0 to 1.0 (endpoint)
        // Overshoot progress goes from 1.0 to 1.1-1.2 (10-20% beyond endpoint)
        const normalizedAge = age / animDuration;
        
        // Determine max overshoot based on charge level
        const maxOvershoot = chargeRatio >= 0.8 ? 1.2 : 1.1;
        
        // Allow progress to go beyond 1.0 for overshooting
        this.progress = Math.min(normalizedAge, maxOvershoot);
        
        // Update opacity - only fade out after reaching the endpoint
        if (this.progress >= 1.0) {
            // Calculate fade progress from 1.0 (full opacity) to 0.0 (transparent)
            // Map progress 1.0 -> 1.1 to opacity 1.0 -> 0.0
            const fadeProgress = (this.progress - 1.0) / 0.1;
            this.opacity = Constants.PATH_DEFAULT_OPACITY * (1 - fadeProgress);
        } else {
            // Before reaching endpoint, maintain full opacity
            this.opacity = Constants.PATH_DEFAULT_OPACITY;
        }
        
        // Update triangle position - if we're past the normal duration, keep the triangle at the endpoint
        this.updateTrianglePosition();
        
        // For small triangles (rapid clicks), expand the collision area slightly
        // This makes it easier to hit spheres with rapid small triangle clicks
        
        // For larger triangles (more power), increase collision area proportionally
        // Collision boost scales directly with triangle size 
        if (this.triangle.height > 20) {
            // Larger triangles get boost proportional to size
            this.triangle.collisionBoost = 1.0 + (this.powerFactor * 0.7);
        } else if (this.triangle.height < 15) {
            this.triangle.collisionBoost = 1.5;  // Boost collision detection for small triangles
        } else {
            this.triangle.collisionBoost = 1.0;  // Normal collision detection for medium triangles
        }
        
        return true;
    }

    /**
     * Update the triangle position along the path
     */
    updateTrianglePosition() {
        // Allow triangles to overshoot their path by 10%
        const overshootFactor = 1.1; // Allow triangles to move 10% beyond the endpoint
        const effectiveProgress = Math.min(this.progress, overshootFactor);
        
        // Initialize variables needed for calculations
        let trianglePos;
        let normalizedDirX = 0, normalizedDirY = 0;
        let maxOvershootDistance = 0;
        
        if (effectiveProgress <= 1.0) {
            // Standard path calculation for normal progress (before endpoint)
            trianglePos = getPointOnQuadraticCurve(
                this.startX, this.startY, 
                this.controlPointX, this.controlPointY, 
                this.endX, this.endY, 
                effectiveProgress
            );
        } else {
            // Past the endpoint - calculate how far beyond the endpoint we should be
            const overshootDistance = (effectiveProgress - 1.0) / 0.1; // 0.0 to 1.0 representing 0% to 10% overshoot
            
            // Get the endpoint
            const endpoint = getPointOnQuadraticCurve(
                this.startX, this.startY,
                this.controlPointX, this.controlPointY,
                this.endX, this.endY,
                1.0
            );
            
            // For a quadratic Bezier curve, the tangent at the endpoint is:
            // tangent = 2 * (endpoint - controlPoint)
            //
            // This gives us the direction the curve is heading at the endpoint
            // This is mathematically more accurate than using a nearby point for tangent calculation
            
            // Calculate the tangent direction vector
            const dirX = 2 * (this.endX - this.controlPointX);
            const dirY = 2 * (this.endY - this.controlPointY);
            
            // Normalize direction
            const magnitude = Math.sqrt(dirX * dirX + dirY * dirY);
            normalizedDirX = dirX / magnitude;
            normalizedDirY = dirY / magnitude;
            
            // Calculate overshoot distance (10-20% of the total path length depending on charge level)
            const chargeRatio = this.radius / Constants.MOUSE_CIRCLE_RADIUS;
            maxOvershootDistance = this.distance * (chargeRatio >= 0.8 ? 0.2 : 0.1);
            const actualOvershoot = overshootDistance * maxOvershootDistance;
            
            // Calculate the position beyond the endpoint
            trianglePos = {
                x: endpoint.x + normalizedDirX * actualOvershoot,
                y: endpoint.y + normalizedDirY * actualOvershoot
            };
        }
        
        // Get the next position for tangent calculation (for rotation)
        const directionalStep = 0.01;
        let nextPoint;
        
        // For triangles that are already at or beyond the endpoint
        if (effectiveProgress >= 1.0) {
            // Already past endpoint, continue in same direction for rotation calculation
            nextPoint = {
                x: trianglePos.x + normalizedDirX * directionalStep * maxOvershootDistance,
                y: trianglePos.y + normalizedDirY * directionalStep * maxOvershootDistance
            };
        } else {
            // Normal path calculation for the next point
            const nextProgress = Math.min(effectiveProgress + directionalStep, 1.0);
            nextPoint = getPointOnQuadraticCurve(
                this.startX, this.startY,
                this.controlPointX, this.controlPointY,
                this.endX, this.endY,
                nextProgress
            );
        }
        
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
        // Use power factor instead of binary charged state
        const powerFactor = this.triangle.powerFactor;
        const isPowerful = powerFactor > 0.5; // More than 50% power is considered "powerful"
        
        // Get the triangle points for rendering
        // For more powerful triangles, include trail effect points
        const trianglePointsData = this.triangle.calculatePoints(powerFactor > 0.4);
        const trianglePoints = this.triangle.getPointsString();
        
        // Visual effects scale with power
        // More powerful triangles get more glow and brighter color
        const useGlow = powerFactor > 0.3; // Only add glow for moderately powerful triangles
        const triangleGlow = useGlow ? "url(#grayGlow)" : "none";
        const triangleColor = Constants.MOVING_TRIANGLE_FILL;
        const triangleOpacityMultiplier = 1.0 + (powerFactor * 0.3); // Scale opacity with power
        
        // Create the triangle element array (will have multiple elements for charged triangles)
        let triangleElements = [];
        
        // Add trail elements for powerful triangles
        if (trianglePointsData.trail) {
            // Add trail elements (motion blur effect)
            triangleElements = trianglePointsData.trail.map((trailSegment, index) => {
                const trailPoints = trailSegment.points.map(p => `${p.x},${p.y}`).join(" ");
                return (
                    <polygon
                        key={`trail-${this.id}-${index}`}
                        points={trailPoints}
                        fill={triangleColor}
                        stroke="none"
                        opacity={this.opacity * trailSegment.opacity * 0.6}
                    />
                );
            });
        }
        
        // Add the main triangle element
        triangleElements.push(
            <polygon
                key={`triangle-${this.id}`}
                points={trianglePoints}
                fill={triangleColor}
                filter={triangleGlow}
                stroke="none"
                opacity={this.opacity * triangleOpacityMultiplier * (Constants.MOVING_TRIANGLE_OPACITY / Constants.PATH_DEFAULT_OPACITY)}
            />
        );
        
        return {
            pathElement: (
                <path
                    key={`path-${this.id}`}
                    d={this.svgPath}
                    fill="none"
                    stroke={Constants.PATH_STROKE_COLOR}
                    strokeWidth={isPowerful ? Constants.PATH_STROKE_WIDTH * 2 : Constants.PATH_STROKE_WIDTH}
                    opacity={this.opacity * Constants.PATH_OPACITY}
                />
            ),
            triangleElement: triangleElements
        };
    }
}

export default Path;

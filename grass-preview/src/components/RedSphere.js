import React from 'react';
import { Constants } from '../utils/Utils';

/**
 * Class representing a floating red sphere that moves towards the player
 */
class RedSphere {
    /**
     * Create a red sphere
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {number} targetX - X position of target (keyboard circle)
     * @param {number} targetY - Y position of target (keyboard circle)
     */
    constructor(width, height, targetX, targetY) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Generate random starting position on the edge of the canvas
        this.spawnPositionOnEdge(width, height);
        
        this.radius = Constants.RED_SPHERE_RADIUS;
        this.targetX = targetX;
        this.targetY = targetY || height / 1.2; // Default Y position if not provided
        this.speedX = Constants.RED_SPHERE_BASE_SPEED * (Math.random() * 0.5 + 0.75); // Random speed variation
        this.speedY = Constants.RED_SPHERE_BASE_SPEED * (Math.random() * 0.5 + 0.75);
        this.floatAmplitude = Constants.RED_SPHERE_FLOAT_AMPLITUDE * (Math.random() + 0.5); // Random float amplitude
        this.floatSpeed = Constants.RED_SPHERE_FLOAT_SPEED * (Math.random() + 0.5); // Random float speed
        this.floatOffset = Math.random() * Math.PI * 2; // Random starting phase
        this.timeCreated = Date.now();
        this.lifetime = Constants.RED_SPHERE_LIFETIME;
        this.opacity = 0;
        this.fadeInDuration = 1000; // Time in ms to fade in
    }
    
    /**
     * Generate a random position on the edge of the canvas
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     */
    spawnPositionOnEdge(width, height) {
        // Choose a random edge (0: top, 1: right, 2: bottom, 3: left)
        const edge = Math.floor(Math.random() * 4);
        
        switch(edge) {
            case 0: // Top edge
                this.x = Math.random() * width;
                this.y = -this.radius * 2;
                break;
            case 1: // Right edge
                this.x = width + this.radius * 2;
                this.y = Math.random() * height;
                break;
            case 2: // Bottom edge
                this.x = Math.random() * width;
                this.y = height + this.radius * 2;
                break;
            case 3: // Left edge
                this.x = -this.radius * 2;
                this.y = Math.random() * height;
                break;
            default:
                this.x = Math.random() * width;
                this.y = -this.radius * 2;
        }
        
        // Initial "real" position is same as visible position
        this.realX = this.x;
        this.realY = this.y;
    }
    
    /**
     * Update the sphere position and state
     * @param {number} now - Current timestamp
     * @param {number} targetX - Current X position of keyboard circle
     * @param {number} targetY - Current Y position of keyboard circle
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {boolean} True if sphere is still active, false if it should be removed
     */
    update(now, targetX, targetY, width, height) {
        const age = now - this.timeCreated;
        
        // Fade in animation
        if (age < this.fadeInDuration) {
            this.opacity = age / this.fadeInDuration;
        } else {
            this.opacity = 1.0;
        }
        
        // Check if lifetime expired
        if (age > this.lifetime) {
            return false;
        }
        
        // Update target position
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Debug logging for troubleshooting (will log every 300th frame to avoid console spam)
        if (Math.random() < 0.003) {
            console.log(`Red Sphere targeting: X=${targetX}, Y=${targetY}, currently at: X=${this.realX.toFixed(2)}, Y=${this.realY.toFixed(2)}`);
        }
        
        // Calculate direction to target
        const dx = this.targetX - this.realX;
        const dy = this.targetY - this.realY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = distance > 0 ? dx / distance : 0;
        const dirY = distance > 0 ? dy / distance : 0;
        
        // Move towards target with much higher speed for very obvious movement
        this.realX += dirX * this.speedX * 6.0; // Multiplied by 6 for extremely visible movement
        this.realY += dirY * this.speedY * 6.0; // Multiplied by 6 for extremely visible movement
        
        // COMPLETELY REMOVE floating motion - direct positioning only
        this.x = this.realX;
        this.y = this.realY;
        
        return true;
    }
    
    /**
     * Check if sphere collides with player circle
     * @param {number} playerX - Player circle X position
     * @param {number} playerY - Player circle Y position
     * @param {number} playerRadius - Player circle radius
     * @returns {boolean} True if collision detected
     */
    checkCollision(playerX, playerY, playerRadius) {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + playerRadius);
    }
    
    /**
     * Get SVG elements for rendering
     * @returns {Object} SVG element
     */
    getElement() {
        // Calculate vector to target for direction indicator
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;
        const lineLength = this.radius * 1.5; // Length of direction indicator
        
        return (
            <g key={`redsphere-group-${this.id}`}>
                {/* Main red sphere */}
                <circle
                    key={`redsphere-${this.id}`}
                    cx={this.x}
                    cy={this.y}
                    r={this.radius}
                    fill={Constants.RED_SPHERE_FILL}
                    opacity={this.opacity}
                    filter="url(#redGlow)"
                />
                
                {/* Direction indicator line pointing toward target */}
                <line
                    x1={this.x}
                    y1={this.y}
                    x2={this.x + dirX * lineLength}
                    y2={this.y + dirY * lineLength}
                    stroke="yellow"
                    strokeWidth="3"
                    opacity={this.opacity * 0.8}
                />
            </g>
        );
    }
}

export default RedSphere;

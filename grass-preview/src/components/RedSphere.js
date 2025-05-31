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
     */
    constructor(width, height, targetX) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Generate random starting position on the edge of the canvas
        this.spawnPositionOnEdge(width, height);
        
        this.radius = Constants.RED_SPHERE_RADIUS;
        this.targetX = targetX;
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
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {boolean} True if sphere is still active, false if it should be removed
     */
    update(now, targetX, width, height) {
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
        
        // Update target X position
        this.targetX = targetX;
        
        // Calculate direction to target
        const targetY = height / 1.2; // Same Y level as keyboard circle
        const dx = this.targetX - this.realX;
        const dy = targetY - this.realY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction
        const dirX = distance > 0 ? dx / distance : 0;
        const dirY = distance > 0 ? dy / distance : 0;
        
        // Move towards target
        this.realX += dirX * this.speedX;
        this.realY += dirY * this.speedY;
        
        // Apply floating motion using sine wave
        const floatOffsetX = Math.sin((now / 1000) * this.floatSpeed + this.floatOffset) * this.floatAmplitude;
        const floatOffsetY = Math.cos((now / 1000) * this.floatSpeed + this.floatOffset * 0.7) * this.floatAmplitude;
        
        // Update visible position
        this.x = this.realX + floatOffsetX;
        this.y = this.realY + floatOffsetY;
        
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
        return (
            <circle
                key={`redsphere-${this.id}`}
                cx={this.x}
                cy={this.y}
                r={this.radius}
                fill={Constants.RED_SPHERE_FILL}
                opacity={this.opacity}
                filter="url(#redGlow)"
            />
        );
    }
}

export default RedSphere;

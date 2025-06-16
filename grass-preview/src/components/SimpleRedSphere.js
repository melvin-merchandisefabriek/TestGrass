import React from 'react';

/**
 * Extremely simplified red sphere that moves directly toward a target
 */
class SimpleRedSphere {
    constructor(width, height, targetX, targetY) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Choose a random edge for spawning
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        
        // Set initial position on one of the edges
        switch (edge) {
            case 0: // Top edge
                this.x = Math.random() * width;
                this.y = 0;
                break;
            case 1: // Right edge
                this.x = width;
                this.y = Math.random() * height;
                break;
            case 2: // Bottom edge
                this.x = Math.random() * width;
                this.y = height;
                break;
            case 3: // Left edge
                this.x = 0;
                this.y = Math.random() * height;
                break;
            default:
                this.x = 0;
                this.y = 0;
        }
        
        // Set the target position
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Set a fixed speed (extremely slow movement as requested)
        this.speed = 0.05; // Made even slower (about 4 times slower than before)
        
        // Generate a random radius between 10 and 30
        const randomSizeFactor = Math.random();
        
        // Make different sized spheres
        // Small (10-15px): 25% chance
        // Medium (15-25px): 50% chance
        // Large (25-35px): 25% chance
        let baseRadius;
        if (randomSizeFactor < 0.25) {
            // Small sphere
            baseRadius = 10 + (randomSizeFactor * 4) * 5/0.25;
        } else if (randomSizeFactor < 0.75) {
            // Medium sphere
            baseRadius = 15 + ((randomSizeFactor - 0.25) * 2) * 10/0.5;
        } else {
            // Large sphere
            baseRadius = 25 + ((randomSizeFactor - 0.75) * 4) * 10/0.25;
        }
        
        // Basic properties
        this.radius = baseRadius;
        this.originalRadius = baseRadius; // Store original radius for reference
        
        // Health is proportional to size - bigger spheres have more health
        // Each unit of health is approximately 20% of the original radius
        this.maxHealth = Math.ceil(this.radius / 4); // Health points based on size
        this.health = this.maxHealth; // Current health
        
        this.timeCreated = Date.now();
        this.lifetime = 20000; // 20 seconds
        this.hitByTriangle = false; // Track if hit by triangle
        this.lastHitTime = 0; // Track when last hit by triangle
        this.minRadius = 5; // Minimum radius before disappearing
        
        // Debug identifier for logging
        this.debugId = Math.floor(Math.random() * 1000);
    }
    
    /**
     * Update sphere position - simplified with direct movement
     */
    update(now, targetX, targetY, width, height) {
        // Update target
        this.targetX = targetX;
        this.targetY = targetY;
        
        // Calculate direction vector to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Print debug info every ~5 seconds for this sphere
        if (Math.random() < 0.01) {
            console.log(`Sphere #${this.debugId} at (${this.x.toFixed(0)},${this.y.toFixed(0)}) → target (${targetX.toFixed(0)},${targetY.toFixed(0)}), dist: ${distance.toFixed(0)}px`);
        }
        
        // Check if we've reached the target
        if (distance < 5) {
            return true; // Keep sphere active but don't move if very close to target
        }
        
        // Calculate normalized direction
        const dirX = dx / distance;
        const dirY = dy / distance;
        
        // Move directly toward target with very high speed for obvious movement
        const prevX = this.x;
        const prevY = this.y;
        
        this.x += dirX * this.speed;
        this.y += dirY * this.speed;
        
        // Log significant position changes (to verify movement is happening)
        if (Math.abs(this.x - prevX) > 5 || Math.abs(this.y - prevY) > 5) {
            if (Math.random() < 0.1) {  // Only log occasionally to avoid spam
                console.log(`Sphere #${this.debugId} moved: (${prevX.toFixed(0)},${prevY.toFixed(0)}) → (${this.x.toFixed(0)},${this.y.toFixed(0)})`);
            }
        }
        
        // Remove if lifetime expired
        if (now - this.timeCreated > this.lifetime) {
            return false;
        }
        
        // Remove if way outside canvas
        const margin = 100;  // Increased margin
        if (this.x < -margin || this.x > width + margin || 
            this.y < -margin || this.y > height + margin) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check for collision with player circle
     */
    checkCollision(playerX, playerY, playerRadius) {
        const dx = this.x - playerX;
        const dy = this.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.radius + playerRadius);
    }
    
    /**
     * Handle collision with a triangle projectile
     * @param {number} extraDamage - Additional damage based on triangle power
     * @returns {boolean} True if the sphere should be removed
     */
    handleTriangleHit(extraDamage = 0) {
        // Get time of hit
        this.lastHitTime = Date.now();
        this.hitCount++;
        
        // Store previous radius for animation effects
        this.prevRadius = this.radius;
        
        // Total damage = 1 base damage + extra damage from triangle power
        const totalDamage = 1 + extraDamage;
        
        // Apply damage proportionally to sphere health
        // Larger spheres have more health, so take more hits
        this.health -= totalDamage;
        
        // Log hit details
        const isPowerful = extraDamage > 0;
        if (isPowerful) {
            console.log(`Sphere #${this.debugId} hit by POWERFUL triangle! Damage: ${totalDamage}, Health: ${this.health}/${this.maxHealth}`);
        } else {
            console.log(`Sphere #${this.debugId} hit! Health: ${this.health}/${this.maxHealth}`);
        }
        
        // Calculate new radius proportional to remaining health
        // Health can't go below 0
        const healthRatio = Math.max(0, this.health) / this.maxHealth;
        
        // Calculate new radius - shrinks proportionally with health loss
        this.radius = Math.max(
            this.minRadius,
            this.originalRadius * (0.5 + 0.5 * healthRatio) // Never shrink below 50% until death
        );
        
        console.log(`Sphere #${this.debugId} new size: ${this.radius.toFixed(1)}px (${(healthRatio * 100).toFixed(0)}% health)`);
        
        // Temporarily boost opacity to give visual feedback of the hit
        this.hitFlash = true;
        
        // Hit power determines visual flash effect (0-1)
        this.lastHitPower = extraDamage / 3; // Normalize to 0-1 range (assuming max extraDamage is 3)
        
        // Clear the hit flash after a short delay
        // More powerful hits have slightly longer visual feedback
        setTimeout(() => {
            this.hitFlash = false;
            this.lastHitPower = 0;
        }, 200 + (extraDamage * 50)); // 200-350ms based on damage
        
        // Return true if the sphere should be removed (health depleted)
        return this.health <= 0;
    }
    
    /**
     * Get SVG element for rendering
     */
    getElement() {
        // Calculate opacity based on how much the sphere has shrunk
        // Start fading out when sphere has been hit multiple times
        const opacityMultiplier = this.hitCount > 0 
            ? Math.min(1, this.radius / this.originalRadius + 0.2)
            : 1;
            
        // Determine fill color - flash brighter when hit for better feedback
        const fillColor = this.hitFlash ? "#aaaaaa" : "#777777";
        
        // For visual feedback of hit, add a temporary flash effect
        // Hit power determines the intensity of the effect
        const hitPower = this.lastHitPower || 0;
        const isPowerfulHit = hitPower > 0.5;
        
        const flashElement = this.hitFlash ? (
            <g>
                <circle
                    cx={this.x}
                    cy={this.y}
                    r={this.prevRadius || this.radius + 5}
                    fill={`rgba(${255}, ${255}, ${255}, ${0.5 + hitPower * 0.2})`}
                    opacity={0.5 + hitPower * 0.2}
                    filter="url(#grayGlow)"
                />
                {/* Extra rings for more powerful hits - scales with hit power */}
                {hitPower > 0.3 && (
                    <>
                        <circle
                            cx={this.x}
                            cy={this.y}
                            r={(this.prevRadius || this.radius) + (8 + hitPower * 5)}
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth={1 + hitPower}
                            opacity={0.2 + hitPower * 0.2}
                        />
                        {hitPower > 0.6 && (
                            <circle
                                cx={this.x}
                                cy={this.y}
                                r={(this.prevRadius || this.radius) + (12 + hitPower * 8)}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={hitPower}
                                opacity={0.1 + hitPower * 0.1}
                            />
                        )}
                    </>
                )}
            </g>
        ) : null;
        
        return (
            <g key={`simple-sphere-${this.id}`}>
                {/* Flash effect when hit */}
                {flashElement}
                
                {/* Gray sphere */}
                <circle
                    cx={this.x}
                    cy={this.y}
                    r={this.radius}
                    fill={fillColor}
                    opacity={opacityMultiplier}
                    filter="url(#grayGlow)"
                />
                
                {/* Visual indicator of damage - larger indicator for more damaged spheres */}
                {this.hitCount > 0 && (
                    <circle
                        cx={this.x}
                        cy={this.y}
                        r={Math.max(2, this.radius / 3)}
                        fill="#ffffff"
                        opacity={Math.min(0.2 + (1 - (this.health / this.maxHealth)) * 0.5, 0.7)}
                    />
                )}
            </g>
        );
    }
    
    /**
     * Get debug info about this sphere
     * @returns {string} Debug information
     */
    getDebugInfo() {
        return `Sphere #${this.debugId}: Position (${this.x.toFixed(1)}, ${this.y.toFixed(1)}), `+
               `Radius ${this.radius.toFixed(1)}, Hit count: ${this.hitCount}`;
    }
}

export default SimpleRedSphere;

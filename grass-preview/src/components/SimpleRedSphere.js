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
        
        // Set a fixed speed (significantly higher for very visible movement)
        this.speed = 8.0;
        
        // Basic properties
        this.radius = 20;
        this.timeCreated = Date.now();
        this.lifetime = 20000; // 20 seconds
        
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
     * Get SVG element for rendering
     */
    getElement() {
        // Calculate direction vector for the indicator line
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = distance > 0 ? dx / distance : 0;
        const dirY = distance > 0 ? dy / distance : 0;
        
        // Make the line longer for better visibility
        const lineLength = this.radius * 2.5; 
        
        return (
            <g key={`simple-redsphere-${this.id}`}>
                {/* Direction indicator - drawn BEHIND the sphere */}
                <line 
                    x1={this.x - dirX * this.radius * 0.5}
                    y1={this.y - dirY * this.radius * 0.5}
                    x2={this.x + dirX * lineLength}
                    y2={this.y + dirY * lineLength}
                    stroke="#ffff00" 
                    strokeWidth="6"
                    strokeOpacity="0.8"
                />
                
                {/* Red sphere */}
                <circle
                    cx={this.x}
                    cy={this.y}
                    r={this.radius}
                    fill="#ff3333"
                    filter="url(#redGlow)"
                />
                
                {/* Small dot at the center for better visibility */}
                <circle
                    cx={this.x}
                    cy={this.y}
                    r={4}
                    fill="#ffffff"
                />
                
                {/* Debug ID text */}
                <text
                    x={this.x}
                    y={this.y + 5}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#000"
                    fontWeight="bold"
                >
                    {this.debugId}
                </text>
            </g>
        );
    }
}

export default SimpleRedSphere;

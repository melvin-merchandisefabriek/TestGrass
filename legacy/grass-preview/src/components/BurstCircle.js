import React from 'react';

/**
 * A class representing a burst of particle circles
 * Used for visual effects when spheres are hit or destroyed
 */
class BurstCircle {
    /**
     * Create a burst circle effect
     * @param {number} centerX - X center of the burst
     * @param {number} centerY - Y center of the burst
     * @param {number} size - Size of the burst (affects particle count and distance)
     * @param {boolean} isDestroyed - Whether this is for sphere destruction (larger effect)
     */
    constructor(centerX, centerY, size = 20, isDestroyed = false) {
        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.centerX = centerX;
        this.centerY = centerY;
        this.createdAt = Date.now();
        this.duration = isDestroyed ? 800 : 400; // Duration in ms
        this.isDestroyed = isDestroyed;
        
        // Generate particles
        this.particles = this.generateParticles(size, isDestroyed);
    }
    
    /**
     * Generate random particles for the burst effect
     */
    generateParticles(size, isDestroyed) {
        const particleCount = isDestroyed ? 20 : 10;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            // Calculate random angle and distance from center
            const angle = Math.random() * Math.PI * 2;
            const distance = (Math.random() * 0.8 + 0.2) * size * (isDestroyed ? 2 : 1);
            
            // Calculate end position with some randomness
            const endX = this.centerX + Math.cos(angle) * distance;
            const endY = this.centerY + Math.sin(angle) * distance;
            
            // Generate random particle properties
            particles.push({
                startX: this.centerX,
                startY: this.centerY,
                endX: endX,
                endY: endY,
                radius: Math.random() * 3 + 1,
                color: this.getRandomGrayColor(),
                speedMultiplier: Math.random() * 0.5 + 0.5
            });
        }
        
        return particles;
    }
    
    /**
     * Get a random gray color for particles
     */
    getRandomGrayColor() {
        const grays = ['#777777', '#888888', '#999999', '#aaaaaa', '#666666', '#555555'];
        return grays[Math.floor(Math.random() * grays.length)];
    }
    
    /**
     * Update the burst animation
     * @returns {boolean} True if animation is still active, false if complete
     */
    update() {
        const now = Date.now();
        const age = now - this.createdAt;
        
        if (age >= this.duration) {
            return false; // Animation complete
        }
        
        return true; // Still animating
    }
    
    /**
     * Calculate current particle positions based on progress
     * @param {number} progress - Animation progress from 0 to 1
     */
    calculateParticlePositions(progress) {
        return this.particles.map(particle => {
            // Adjust progress based on particle speed
            const particleProgress = Math.min(1, progress * particle.speedMultiplier);
            
            // Linear interpolation between start and end positions
            const x = particle.startX + (particle.endX - particle.startX) * particleProgress;
            const y = particle.startY + (particle.endY - particle.startY) * particleProgress;
            
            // Fade out toward the end
            const fadeStart = 0.7;
            const opacity = particleProgress > fadeStart 
                ? 1 - ((particleProgress - fadeStart) / (1 - fadeStart))
                : 1;
                
            return { x, y, radius: particle.radius, color: particle.color, opacity };
        });
    }
    
    /**
     * Get SVG elements for rendering
     * @returns {Array} Array of SVG circle elements
     */
    getElements() {
        const now = Date.now();
        const age = now - this.createdAt;
        const progress = Math.min(1, age / this.duration);
        
        // Calculate current particle positions
        const particlePositions = this.calculateParticlePositions(progress);
        
        // Create SVG elements for each particle
        return particlePositions.map((particle, index) => (
            <circle
                key={`burst-${this.id}-particle-${index}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.radius}
                fill={particle.color}
                opacity={particle.opacity}
            />
        ));
    }
}

export default BurstCircle;
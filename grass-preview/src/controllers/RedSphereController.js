import RedSphere from '../components/RedSphere';
import { Constants } from '../utils/Utils';

/**
 * Controller class for managing red spheres
 */
class RedSphereController {
    /**
     * Create a red sphere controller
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Function} onSpheresUpdated - Callback when spheres are updated
     */
    constructor(width, height, onSpheresUpdated) {
        this.width = width;
        this.height = height;
        this.onSpheresUpdated = onSpheresUpdated;
        this.spheres = [];
        this.lastSpawnAttempt = Date.now();
        this.animationFrameId = null;
        this.targetX = this.width / 2; // Default target position
        this.animate = this.animate.bind(this);
    }
    
    /**
     * Initialize the controller
     */
    init() {
        this.animationFrameId = requestAnimationFrame(this.animate);
    }
    
    /**
     * Update the keyboard circle position (target for red spheres)
     * @param {number} x - Circle X position
     */
    updateTargetPosition(x) {
        this.targetX = x;
    }
    
    /**
     * Animation loop for red spheres
     */
    animate() {
        const now = Date.now();
        
        // Random chance to spawn a new red sphere if we don't have too many
        if (this.spheres.length < Constants.RED_SPHERE_MAX_COUNT && 
            Math.random() < Constants.RED_SPHERE_SPAWN_CHANCE) {
            this.spawnRedSphere();
        }
        
        // Update all existing spheres
        this.spheres = this.spheres.filter(sphere => 
            sphere.update(now, this.targetX, this.width, this.height)
        );
        
        // Notify BlankCanvas about sphere updates
        if (this.onSpheresUpdated) {
            this.onSpheresUpdated(this.spheres);
        }
        
        this.animationFrameId = requestAnimationFrame(this.animate);
    }
    
    /**
     * Create a new red sphere
     */
    spawnRedSphere() {
        const sphere = new RedSphere(this.width, this.height, this.targetX);
        this.spheres.push(sphere);
    }
    
    /**
     * Check for collisions with the player circle
     * @param {number} playerX - Player circle X position
     * @param {number} playerY - Player circle Y position
     * @param {number} playerRadius - Player circle radius
     * @returns {boolean} True if collision detected
     */
    checkCollisions(playerX, playerY, playerRadius) {
        for (let sphere of this.spheres) {
            if (sphere.checkCollision(playerX, playerY, playerRadius)) {
                // Remove the sphere that collided
                this.spheres = this.spheres.filter(s => s.id !== sphere.id);
                
                // Notify about sphere updates
                if (this.onSpheresUpdated) {
                    this.onSpheresUpdated(this.spheres);
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * Get all current red spheres
     * @returns {Array} Array of red sphere objects
     */
    getSpheres() {
        return this.spheres;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.spheres = [];
    }
}

export default RedSphereController;

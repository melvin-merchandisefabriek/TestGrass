import RedSphere from '../components/RedSphere';
import SimpleRedSphere from '../components/SimpleRedSphere';
import { Constants } from '../utils/Utils';

/**
 * Controller class for managing red spheres
 * COMPLETELY REWRITTEN to ensure spheres move correctly toward the target
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
        this.targetX = this.width / 2; // Default target position X
        this.targetY = this.height / 1.2; // Default target position Y (same as keyboard circle)
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
     * @param {number} y - Circle Y position (optional)
     */
    updateTargetPosition(x, y) {
        this.targetX = x;
        if (y !== undefined) {
            this.targetY = y;
        }
        
        // Add a debug log to confirm the target position is being updated correctly
        console.log(`RedSphereController target updated: X=${this.targetX}, Y=${this.targetY}`);
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
            sphere.update(now, this.targetX, this.targetY, this.width, this.height)
        );
        
        // Check for collisions with the target (white sphere) every frame
        this.checkCollisionWithStaticTarget();
        
        // Notify BlankCanvas about sphere updates
        if (this.onSpheresUpdated) {
            this.onSpheresUpdated(this.spheres);
        }
        
        this.animationFrameId = requestAnimationFrame(this.animate);
    }
    
    /**
     * Check collisions with static target - call this every frame for continuous collision detection
     */
    checkCollisionWithStaticTarget() {
        if (this.spheres.length === 0) return;
        
        const spheresToRemove = [];
        
        // Check each sphere for collision with the target position
        for (let sphere of this.spheres) {
            // Get the distance to the target
            const dx = sphere.x - this.targetX;
            const dy = sphere.y - this.targetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If very close to target (within some threshold), consider it a collision
            if (distance < Constants.CIRCLE_RADIUS + sphere.radius - 5) {
                spheresToRemove.push(sphere.id);
                console.log(`Sphere ${sphere.id} collided with static target at (${this.targetX}, ${this.targetY})`);
            }
        }
        
        // Remove any spheres that had collisions
        if (spheresToRemove.length > 0) {
            this.spheres = this.spheres.filter(sphere => !spheresToRemove.includes(sphere.id));
            
            // Notify BlankCanvas about updated spheres
            if (this.onSpheresUpdated) {
                this.onSpheresUpdated(this.spheres);
            }
        }
    }
    
    /**
     * Create a new red sphere
     */
    spawnRedSphere() {
        // Use SimpleRedSphere instead of RedSphere for more direct movement
        const sphere = new SimpleRedSphere(this.width, this.height, this.targetX, this.targetY);
        this.spheres.push(sphere);
        console.log(`Spawned SimpleRedSphere at (${sphere.x.toFixed(2)}, ${sphere.y.toFixed(2)}) targeting (${this.targetX.toFixed(2)}, ${this.targetY.toFixed(2)})`);
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

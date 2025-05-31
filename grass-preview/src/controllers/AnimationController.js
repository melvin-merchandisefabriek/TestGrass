
/**
 * Class for managing animations
 */
class AnimationController {
    /**
     * Create an animation controller
     */
    constructor() {
        this.paths = [];
        this.timestamp = 0;
        this.animationFrame = null;
        this.onPathsUpdated = null;
    }

    /**
     * Add a path to the animation controller
     * @param {Path} path - Path object to add
     */
    addPath(path) {
        this.paths = [...this.paths, path];
        
        // Start animation if not already running
        if (!this.animationFrame) {
            this.startAnimation();
        } else {
        }
    }

    /**
     * Set a callback function to be called when paths are updated
     * @param {Function} callback - Function to call with updated paths
     */
    setPathUpdateCallback(callback) {
        this.onPathsUpdated = callback;
    }

    /**
     * Start the animation loop
     */
    startAnimation() {
        // Reset the timestamp
        this.timestamp = 0;
        
        // Start the animation
        this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Animation frame handler
     * @param {DOMHighResTimeStamp} timestamp - Current timestamp
     */
    animate(timestamp) {
        // Skip if there are no paths
        if (this.paths.length === 0) {
            this.animationFrame = null;
            return;
        }
        
        // Time tracking for smooth animation
        if (!this.timestamp) {
            this.timestamp = timestamp;
        }
        
        // Current time for age calculations
        const now = Date.now();
        
        // Update paths
        const updatedPaths = this.paths.filter(path => path.update(now));
        
        // Store updated paths
        this.paths = updatedPaths;
        
        // Notify about path updates
        if (this.onPathsUpdated) {
            this.onPathsUpdated([...updatedPaths]);
        }
        
        // Request next frame if we still have paths
        if (updatedPaths.length > 0) {
            this.animationFrame = requestAnimationFrame(this.animate.bind(this));
        } else {
            this.animationFrame = null;
        }
    }

    /**
     * Stop all animations
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stopAnimation();
        this.paths = [];
    }
}

export default AnimationController;

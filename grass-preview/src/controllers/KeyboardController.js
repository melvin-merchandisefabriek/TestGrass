// filepath: /workspaces/TestGrass/grass-preview/src/controllers/KeyboardController.js
import { clamp } from '../utils/Utils';

/**
 * Class for handling keyboard input
 */
class KeyboardController {
    /**
     * Create a keyboard controller
     * @param {number} moveSpeed - Move speed in pixels per frame
     * @param {number} accelerationRate - Acceleration rate (lower = faster)
     * @param {number} minX - Minimum X position
     * @param {number} maxX - Maximum X position
     * @param {Function} onPositionChange - Callback for position changes
     * @param {Function} onSpawnRedSphere - Callback for spawning red sphere (optional)
     */
    constructor(moveSpeed, accelerationRate, minX, maxX, onPositionChange, onSpawnRedSphere = null) {
        this.moveSpeed = moveSpeed;
        this.accelerationRate = accelerationRate;
        this.minX = minX;
        this.maxX = maxX;
        this.onPositionChange = onPositionChange;
        this.onSpawnRedSphere = onSpawnRedSphere;
        this.keysPressed = {};
        this.animationFrameId = null;
        this.position = 0;
        
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.movePosition = this.movePosition.bind(this);
    }

    /**
     * Initialize the controller
     * @param {number} initialPosition - Initial X position
     */
    init(initialPosition) {
        this.position = initialPosition;
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Handle key down events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        // Handle movement keys
        if ((e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") && !this.keysPressed[e.key]) {
            this.keysPressed[e.key] = true;
            
            // Start animation if it's not already running
            if (this.animationFrameId === null) {
                this.animationFrameId = requestAnimationFrame(this.movePosition);
            }
        }
        
        // Handle 'R' key to spawn red sphere
        if ((e.key === "r" || e.key === "R") && !this.keysPressed[e.key]) {
            this.keysPressed[e.key] = true;
            if (this.onSpawnRedSphere) {
                this.onSpawnRedSphere();
            }
        }
    }

    /**
     * Handle key up events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyUp(e) {
        this.keysPressed[e.key] = false;
        
        if (e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
            // Reset held duration for the released key
            if (e.key === "a" || e.key === "A") {
                this.keysPressed.aHeldDuration = 0;
                this.keysPressed.AHeldDuration = 0;
            } else if (e.key === "d" || e.key === "D") {
                this.keysPressed.dHeldDuration = 0;
                this.keysPressed.DHeldDuration = 0;
            }
            
            // Stop animation if no movement keys are pressed
            if (!this.keysPressed.a && !this.keysPressed.A && 
                !this.keysPressed.d && !this.keysPressed.D) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }

    /**
     * Update position based on key presses
     */
    movePosition() {
        let newPosition = this.position;
        
        // Left movement with A key
        if (this.keysPressed.a || this.keysPressed.A) {
            // Increase speed if key is held down longer
            const heldDuration = this.keysPressed.aHeldDuration || this.keysPressed.AHeldDuration || 0;
            const speedMultiplier = 1 + Math.min(heldDuration / this.accelerationRate, 4); // Up to 5x speed
            newPosition -= this.moveSpeed * speedMultiplier;
            // Track how long the key is held
            this.keysPressed.aHeldDuration = (this.keysPressed.aHeldDuration || 0) + 1;
            this.keysPressed.AHeldDuration = (this.keysPressed.AHeldDuration || 0) + 1;
        }
        
        // Right movement with D key
        if (this.keysPressed.d || this.keysPressed.D) {
            // Increase speed if key is held down longer
            const heldDuration = this.keysPressed.dHeldDuration || this.keysPressed.DHeldDuration || 0;
            const speedMultiplier = 1 + Math.min(heldDuration / this.accelerationRate, 4); // Up to 5x speed
            newPosition += this.moveSpeed * speedMultiplier;
            // Track how long the key is held
            this.keysPressed.dHeldDuration = (this.keysPressed.dHeldDuration || 0) + 1;
            this.keysPressed.DHeldDuration = (this.keysPressed.DHeldDuration || 0) + 1;
        }
        
        // Clamp the position within bounds
        this.position = clamp(newPosition, this.minX, this.maxX);
        
        // Notify about position change
        if (this.onPositionChange) {
            this.onPositionChange(this.position);
        }
        
        this.animationFrameId = requestAnimationFrame(this.movePosition);
    }

    /**
     * Get the current position
     * @returns {number} Current X position
     */
    getPosition() {
        return this.position;
    }

    /**
     * Clean up event listeners
     */
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

export default KeyboardController;

import { interpolateByHalvingOrDoubling, Constants } from '../utils/Utils';

/**
 * Class for handling mouse interactions
 */
class MouseController {
    /**
     * Create a mouse controller
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Function} onPositionChange - Callback for position changes
     * @param {Function} onMouseStateChange - Callback for mouse state changes
     * @param {Function} onRadiusChange - Callback for radius changes
     * @param {Function} onPathCreated - Callback for path creation
     */
    constructor(width, height, onPositionChange, onMouseStateChange, onRadiusChange, onPathCreated) {
        this.width = width;
        this.height = height;
        this.onPositionChange = onPositionChange;
        this.onMouseStateChange = onMouseStateChange;
        this.onRadiusChange = onRadiusChange;
        this.onPathCreated = onPathCreated;
        
        this.position = { x: 0, y: 0 };
        this.isMouseDown = false;
        this.circleRadius = Constants.MOUSE_CIRCLE_RADIUS;
        this.radiusAnimationRef = null;
        
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.animateRadius = this.animateRadius.bind(this);
    }

    /**
     * Initialize the controller
     */
    init() {
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mousedown', this.handleMouseDown);
        window.addEventListener('mouseup', () => {
            // Get the current circle X from BlankCanvas
            if (this._currentCircleX !== undefined) {
                this.handleMouseUp(this._currentCircleX);
            } else {
                this.handleMouseUp(window.innerWidth / 2); // Default fallback
            }
        });
        
        // Start radius animation
        this.radiusAnimationRef = requestAnimationFrame(this.animateRadius);
    }
    
    /**
     * Update the current circle X position
     * @param {number} x - The current circle X position
     */
    updateCircleX(x) {
        this._currentCircleX = x;
    }

    /**
     * Handle mouse move events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        // Get the SVG element's position
        const svg = document.querySelector('svg');
        if (svg) {
            const rect = svg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Only update if mouse is within SVG boundaries
            if (x >= 0 && x <= this.width && y >= 0 && y <= this.height) {
                this.position = { x, y };
                
                if (this.onPositionChange) {
                    this.onPositionChange(this.position);
                }
            }
        }
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown() {
        this.isMouseDown = true;
        
        if (this.onMouseStateChange) {
            this.onMouseStateChange(this.isMouseDown);
        }
    }

    /**
     * Handle mouse up events
     * @param {number} circleX - Current X position of the player circle
     */
    handleMouseUp(circleX) {
        // Only create a path if the mouse was previously down
        if (this.isMouseDown && this.onPathCreated) {
            const startX = circleX;
            const startY = this.height / 1.2;
            const endX = this.position.x;
            const endY = this.position.y;
            
            this.onPathCreated(startX, startY, endX, endY, this.circleRadius);
        }
        
        this.isMouseDown = false;
        
        if (this.onMouseStateChange) {
            this.onMouseStateChange(this.isMouseDown);
        }
    }

    /**
     * Animate the circle radius
     */
    animateRadius() {
        const targetRadius = this.isMouseDown ? Constants.MOUSE_CIRCLE_MIN_RADIUS : Constants.MOUSE_CIRCLE_RADIUS;
        
        // Use interpolation function to animate radius
        const newRadius = interpolateByHalvingOrDoubling(
            this.circleRadius, 
            targetRadius, 
            this.isMouseDown ? 0.015 : 0.2, 
            0.1
        );
        
        // Update the radius
        if (Math.abs(newRadius - targetRadius) < 0.1) {
            this.circleRadius = targetRadius;
        } else {
            this.circleRadius = newRadius;
        }
        
        // Notify about radius change
        if (this.onRadiusChange) {
            this.onRadiusChange(this.circleRadius);
        }
        
        this.radiusAnimationRef = requestAnimationFrame(this.animateRadius);
    }

    /**
     * Get the current mouse position
     * @returns {Object} Current mouse position {x, y}
     */
    getPosition() {
        return this.position;
    }

    /**
     * Get the current mouse state
     * @returns {boolean} True if mouse is down, false otherwise
     */
    isDown() {
        return this.isMouseDown;
    }

    /**
     * Get the current circle radius
     * @returns {number} Current circle radius
     */
    getRadius() {
        return this.circleRadius;
    }

    /**
     * Clean up event listeners and animations
     */
    dispose() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('mousedown', this.handleMouseDown);
        window.removeEventListener('mouseup', this.handleMouseUp);
        
        if (this.radiusAnimationRef) {
            cancelAnimationFrame(this.radiusAnimationRef);
            this.radiusAnimationRef = null;
        }
    }
}

export default MouseController;

import React, { Component } from 'react';
import Triangle from './components/Triangle';
import Path from './components/Path';
import AnimationController from './controllers/AnimationController';
import KeyboardController from './controllers/KeyboardController';
import MouseController from './controllers/MouseController';
import RedSphereController from './controllers/RedSphereController';
import { Constants } from './utils/Utils';

/**
 * BlankCanvas component implemented as a class-based React component
 * that composes functionality from several specialized classes.
 */
class BlankCanvas extends Component {
    constructor(props) {
        super(props);
        
        // Dimensions with default values
        this.width = props.width || 1000;
        this.height = props.height || 700;
        
        // State initialization
        this.state = {
            circleX: this.width / 2,
            mousePosition: { x: 0, y: 0 },
            isMouseDown: false,
            circleRadius: Constants.MOUSE_CIRCLE_RADIUS,
            tempPaths: [],
            redSpheres: [],
            importedShapes: [],
            selectedShapeIndex: null,
            isLoadingShapes: false
        };
        
        // Initialize burst circles array
        this.burstCircles = [];
        
        // Reference to controllers (will be initialized in componentDidMount)
        this.keyboardController = null;
        this.mouseController = null;
        this.animationController = null;
        this.redSphereController = null;
    }
    
    componentDidMount() {
        // Initialize the keyboard controller
        this.keyboardController = new KeyboardController(
            Constants.MOVE_SPEED,
            Constants.ACCELERATION_RATE,
            Constants.CIRCLE_RADIUS,
            this.width - Constants.CIRCLE_RADIUS,
            this.handleCircleXChange
        );
        this.keyboardController.init(this.state.circleX);
        
        // Initialize the mouse controller
        this.mouseController = new MouseController(
            this.width,
            this.height,
            this.handleMousePositionChange,
            this.handleMouseStateChange,
            this.handleCircleRadiusChange,
            this.handlePathCreation
        );
        this.mouseController.init();
        
        // Initialize the mouse controller with the initial circleX
        this.mouseController.updateCircleX(this.state.circleX);
        
        // Initialize the animation controller
        this.animationController = new AnimationController();
        this.animationController.setPathUpdateCallback(this.handlePathsUpdated);
        
        // Initialize the red sphere controller
        this.redSphereController = new RedSphereController(
            this.width,
            this.height,
            this.handleRedSpheresUpdated
        );
        this.redSphereController.init();
        this.redSphereController.updateTargetPosition(this.state.circleX, this.height / 1.2);
        
        // Force spawn multiple red spheres immediately to test movement
        setTimeout(() => {
            // Force spawn 10 spheres at startup around the edges
            for (let i = 0; i < 10; i++) {
                this.redSphereController.spawnRedSphere();
            }
            console.log("Forced spawn of 10 SimpleRedSpheres to test movement");
            
            // Set an interval to spawn new spheres every 2 seconds
            setInterval(() => {
                if (this.redSphereController.getSpheres().length < 15) {
                    this.redSphereController.spawnRedSphere();
                }
            }, 2000);
        }, 1000);
    }
    
    componentDidUpdate(prevProps, prevState) {
        // Check for collisions between the keyboard circle and any red spheres
        // Always check regardless of whether the circle has moved
        if (this.redSphereController) {
            const collision = this.redSphereController.checkCollisions(
                this.state.circleX,
                this.height / 1.2, // Y position of the keyboard circle
                Constants.CIRCLE_RADIUS
            );
            
            if (collision) {
                this.handleSphereCollision();
            }
        }
        
        // Check for triangle-sphere collisions
        this.checkTriangleSphereCollisions();
    }
    
    componentWillUnmount() {
        // Clean up controllers
        if (this.keyboardController) {
            this.keyboardController.dispose();
        }
        
        if (this.mouseController) {
            this.mouseController.dispose();
        }
        
        if (this.animationController) {
            this.animationController.dispose();
        }
        
        if (this.redSphereController) {
            this.redSphereController.dispose();
        }
        
        // Clean up burst animation if active
        if (this.burstAnimationId) {
            cancelAnimationFrame(this.burstAnimationId);
            this.burstAnimationId = null;
        }
    }
    
    // Handler for circle X position changes
    handleCircleXChange = (x) => {
        this.setState({ circleX: x });
        
        // Update the MouseController with the new circleX
        if (this.mouseController) {
            this.mouseController.updateCircleX(x);
        }
        
        // Update the RedSphereController with the new target position
        if (this.redSphereController) {
            const targetY = this.height / 1.2; // Fixed Y position of keyboard circle
            this.redSphereController.updateTargetPosition(x, targetY);
            
            // Log the target update for debugging
            console.log(`BlankCanvas: Updated sphere target to (${x.toFixed(0)}, ${targetY.toFixed(0)})`);
        }
    };
    
    // Handler for mouse position changes
    handleMousePositionChange = (position) => {
        this.setState({ mousePosition: position });
    };
    
    // Handler for mouse state changes (down/up)
    handleMouseStateChange = (isDown) => {
        this.setState({ isMouseDown: isDown });
    };
    
    // Handler for circle radius changes
    handleCircleRadiusChange = (radius) => {
        this.setState({ circleRadius: radius });
    };
    
    // Handler for path creation
    handlePathCreation = (startX, startY, endX, endY, radius) => {
        const { importedShapes, selectedShapeIndex } = this.state;
        
        // If a shape is selected, use it for the projectile
        if (importedShapes.length > 0 && selectedShapeIndex !== null) {
            const selectedShape = importedShapes[selectedShapeIndex];
            
            if (selectedShape && selectedShape.paths) {
                // Create a single path using the shape data
                const path = new Path(startX, startY, endX, endY, radius);
                
                // Attach the shape data to the path for rendering
                path.customShape = selectedShape;
                
                // Add it to the animation controller
                this.animationController.addPath(path);
                this.forceUpdate();
                return;
            }
        }
        
        // If no shape is selected or there was an issue, fall back to default behavior
        const path = new Path(startX, startY, endX, endY, radius);
        this.animationController.addPath(path);
        this.forceUpdate();
    };
    
    // Handler for paths updated from animation controller
    handlePathsUpdated = (paths) => {
        this.setState({ tempPaths: paths }, () => {
            // Check for triangle-sphere collisions after paths are updated
            this.checkTriangleSphereCollisions();
        });
    };
    
    // Handler for red spheres updated from controller
    handleRedSpheresUpdated = (spheres) => {
        this.setState({ redSpheres: spheres });
    };
    
    // Handler for sphere collisions
    handleSphereCollision = () => {
        // Create 12 paths in a circle pattern to create a more visible "burst" effect
        const numberOfPaths = 12;
        const startX = this.state.circleX;
        const startY = this.height / 1.2; // Y position of the keyboard circle
        
        for (let i = 0; i < numberOfPaths; i++) {
            const angle = (i / numberOfPaths) * Math.PI * 2;
            const distance = 100 + Math.random() * 60; // Increased random distance between 100-160
            
            const endX = startX + Math.cos(angle) * distance;
            const endY = startY + Math.sin(angle) * distance;
            
            // Create a new burst path
            const path = new Path(startX, startY, endX, endY, Constants.MOUSE_CIRCLE_MIN_RADIUS);
            
            // Add to animation controller
            this.animationController.addPath(path);
        }
    };
    
    /**
     * Check for triangle-sphere collisions
     * Called after path/triangle positions are updated
     */
    checkTriangleSphereCollisions = () => {
        const { tempPaths, redSpheres } = this.state;
        
        if (!tempPaths.length || !redSpheres.length) return;
        
        // Track spheres that need to be removed
        let spheresToRemove = [];
        // Track spheres that were hit but not removed
        let spheresHit = [];
        
        // Check each triangle against each sphere
        for (let path of tempPaths) {
            // Get the triangle position data
            const triangle = path.triangle;
            const trianglePoints = triangle.points || [];
            
            // Only check triangles that have moved past the beginning phase
            // but also include triangles in their overshooting phase (progress > 1.0)
            // This ensures collisions work during the overshoot phase
            if (path.progress < 0.05 || (path.progress > 0.95 && path.progress < 1.0)) {
                continue; // Skip triangles at the very beginning or end of their normal path
            }
            // Note: Triangles in overshoot phase (progress > 1.0) are explicitly included
            
            // For each sphere, check for collision with the triangle
            for (let i = 0; i < redSpheres.length; i++) {
                const sphere = redSpheres[i];
                
                // Enhanced collision detection for small triangles:
                // 1. Center-to-center distance check with more generous threshold
                // 2. Check distance from sphere center to each triangle vertex
                // 3. Check distance from sphere center to each triangle edge
                
                // 1. Center-to-center distance with increased threshold for small triangles
                const dx = triangle.x - sphere.x;
                const dy = triangle.y - sphere.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Dynamic threshold based on triangle size to improve small triangle hit detection
                const triangleSize = triangle.height + triangle.width;
                const threshold = Math.max(10, sphere.radius + triangleSize / 3);                    // Check if collision occurred
                    let collision = false;
                    
                    // Get triangle power factor (0-1) - affects collision detection
                    const trianglePower = path.triangle.powerFactor || 0;
                    
                    // More powerful triangles get more generous collision detection
                    // Adjust threshold based on triangle power
                    const powerThreshold = threshold * (1 + trianglePower * 0.5);
                    
                    // First check: Simple center distance-based detection with threshold
                    // adjusted by triangle power
                    if (distance < powerThreshold) {
                        collision = true;
                    }
                // Second check: If first check fails, try more precise collision detection
                else if (trianglePoints && trianglePoints.length === 3) {
                    // Check distance from sphere center to each triangle vertex
                    for (let point of trianglePoints) {
                        const ptDx = point.x - sphere.x;
                        const ptDy = point.y - sphere.y;
                        const ptDistance = Math.sqrt(ptDx * ptDx + ptDy * ptDy);
                        
                        if (ptDistance < sphere.radius) {
                            collision = true;
                            break;
                        }
                    }
                    
                    // If still no collision, check distance to each triangle edge
                    if (!collision) {
                        for (let j = 0; j < 3; j++) {
                            const p1 = trianglePoints[j];
                            const p2 = trianglePoints[(j + 1) % 3];
                            
                            // Distance from point (sphere center) to line segment (triangle edge)
                            const edgeDistance = this.distanceToLineSegment(
                                p1.x, p1.y, p2.x, p2.y, sphere.x, sphere.y
                            );
                            
                            if (edgeDistance < sphere.radius) {
                                collision = true;
                                break;
                            }
                        }
                    }
                }
                
                if (collision) {
                    // Don't register hits too frequently on the same sphere
                    const now = Date.now();
                    
                    // Calculate triangle power factor - influences hit cooldown and damage
                    // Triangle power is proportional to size
                    const trianglePower = path.triangle.powerFactor || 0;
                    
                    // More powerful triangles can hit more frequently
                    const hitCooldown = 300 - (trianglePower * 150); // 300ms for small, down to 150ms for powerful
                    
                    // Skip if we're in cooldown (all triangles respect cooldown now)
                    if (sphere.lastHitTime && now - sphere.lastHitTime < hitCooldown) {
                        continue; // Skip this collision if the sphere was hit recently
                    }
                    
                    console.log(`Triangle (power: ${trianglePower.toFixed(2)}) hit sphere #${sphere.debugId} at (${sphere.x.toFixed(0)}, ${sphere.y.toFixed(0)})`);
                    
                    // Damage scales with triangle power factor
                    // More powerful triangles (bigger) do more damage but never instant kill
                    const baseDamage = 1;
                    const extraDamage = Math.floor(trianglePower * 3); // 0 extra for weak, up to 3 extra for strongest
                    
                    // Handle the hit and check if sphere should be removed
                    const shouldRemove = sphere.handleTriangleHit(extraDamage);
                    
                    if (shouldRemove) {
                        if (!spheresToRemove.includes(sphere.id)) {
                            spheresToRemove.push(sphere.id);
                            
                            // Create burst effects that scale with triangle power
                            const burstSize = 30 + (trianglePower * 20); // 30-50px based on power
                            
                            // More powerful triangles create more impressive burst effects
                            if (trianglePower > 0.7) {
                                // Create multiple burst effects for powerful triangle hits
                                this.createBurstEffect(sphere.x, sphere.y, burstSize);  // Main burst
                                
                                // Add secondary bursts for more powerful triangles
                                const extraBursts = Math.floor(trianglePower * 4); // 0-4 extra bursts
                                for (let b = 0; b < extraBursts; b++) {
                                    const offsetX = (Math.random() - 0.5) * 40;
                                    const offsetY = (Math.random() - 0.5) * 40;
                                    this.createBurstEffect(sphere.x + offsetX, sphere.y + offsetY, burstSize * 0.6);
                                }
                                
                                console.log(`Created enhanced burst effect for powerful triangle impact! (power: ${trianglePower.toFixed(2)})`);
                            } else {
                                // Normal burst for regular triangle hit
                                this.createBurstEffect(sphere.x, sphere.y, burstSize);
                            }
                            console.log(`Sphere #${sphere.debugId} destroyed after ${sphere.hitCount} hits`);
                        }
                    } else {
                        // Track spheres that were hit but not removed
                        // Set last hit power for visual feedback
                        sphere.lastHitPower = trianglePower;
                        spheresHit.push(sphere);
                    }
                }
            }
        }
        
        // Create visual effects for spheres that were hit but not destroyed
        spheresHit.forEach(sphere => {
            this.createShrinkEffect(sphere.x, sphere.y);
        });
        
        // Remove any spheres that have been hit enough times
        if (spheresToRemove.length > 0) {
            // Update the controller's spheres
            this.redSphereController.removeSpheres(spheresToRemove);
        }
    };
    
    /**
     * Helper function to calculate distance from a point to a line segment
     * Used for more precise triangle collision detection
     */
    distanceToLineSegment = (x1, y1, x2, y2, pointX, pointY) => {
        // Calculate squared length of line segment
        const lineSegmentLengthSquared = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        
        // If line segment is just a point, return distance to that point
        if (lineSegmentLengthSquared === 0) {
            return Math.sqrt((pointX - x1) * (pointX - x1) + (pointY - y1) * (pointY - y1));
        }
        
        // Calculate projection of the point onto the line segment
        const t = Math.max(0, Math.min(1, 
            ((pointX - x1) * (x2 - x1) + (pointY - y1) * (y2 - y1)) / lineSegmentLengthSquared
        ));
        
        // Calculate the closest point on the line segment
        const closestX = x1 + t * (x2 - x1);
        const closestY = y1 + t * (y2 - y1);
        
        // Return the distance from the point to the closest point on the line segment
        return Math.sqrt((pointX - closestX) * (pointX - closestX) + 
                        (pointY - closestY) * (pointY - closestY));
    };
    
    // Method to manually spawn a red sphere (for testing)
    spawnRedSphere = () => {
        if (this.redSphereController) {
            this.redSphereController.spawnRedSphere();
        }
    };
    
    /**
     * Create a small particle effect when a sphere is hit but not destroyed
     */
    createShrinkEffect = (x, y) => {
        // Import BurstCircle component if needed
        if (!this.BurstCircle) {
            this.BurstCircle = require('./components/BurstCircle').default;
        }
        
        // Create a small burst effect (hit but not destroyed)
        const burst = new this.BurstCircle(x, y, 15, false);
        this.burstCircles.push(burst);
        
        // Start animation if not already running
        if (!this.burstAnimationId) {
            this.animateBurstCircles();
        }
    };
    
    /**
     * Create a larger burst effect when a sphere is destroyed
     * @param {number} x - X-coordinate of the burst
     * @param {number} y - Y-coordinate of the burst
     * @param {number} size - Optional size of the burst (default: 30)
     */
    createBurstEffect = (x, y, size = 30) => {
        // Import BurstCircle component if needed
        if (!this.BurstCircle) {
            this.BurstCircle = require('./components/BurstCircle').default;
        }
        
        // Create a burst effect for destruction with specified size
        const burst = new this.BurstCircle(x, y, size, true);
        this.burstCircles.push(burst);
        
        // Start animation if not already running
        if (!this.burstAnimationId) {
            this.animateBurstCircles();
        }
    };
    
    /**
     * Animate all burst circles and remove completed ones
     */
    animateBurstCircles = () => {
        // Update each burst circle
        this.burstCircles = this.burstCircles.filter(burst => burst.update());
        
        // Force update the component to render the burst circles
        this.forceUpdate();
        
        // Continue animation if there are still burst circles
        if (this.burstCircles.length > 0) {
            this.burstAnimationId = requestAnimationFrame(this.animateBurstCircles);
        } else {
            this.burstAnimationId = null;
        }
    };
    
    render() {
        const { circleX, mousePosition, circleRadius, tempPaths, redSpheres } = this.state;
        
        return (
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                paddingTop: 20,
                width: "100%"
            }}>
                <svg
                    width={this.width}
                    height={this.height}
                    style={{
                        background: "#3498db",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        borderRadius: 4,
                        cursor: "none", // Hide the cursor
                    }}
                >
                    {/* SVG Filters */}
                    <defs>
                        {/* Keeping redGlow for backwards compatibility */}
                        <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feFlood floodColor="white" floodOpacity="1" result="glow" />
                            <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        
                        {/* Adding grayGlow for the gray spheres */}
                        <filter id="grayGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feFlood floodColor="#cccccc" floodOpacity="0.8" result="glow" />
                            <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* Original keyboard-controlled circle */}
                    <circle
                        cx={circleX}
                        cy={this.height / 1.2}
                        r={Constants.CIRCLE_RADIUS}
                        fill={Constants.CIRCLE_FILL_COLOR}
                        stroke="none"
                        strokeWidth={5}
                    />
                    
                    {/* Mouse follower circle */}
                    <circle
                        cx={mousePosition.x}
                        cy={mousePosition.y}
                        r={circleRadius}
                        fill="none"
                        stroke={Constants.MOUSE_CIRCLE_STROKE_COLOR}
                        strokeWidth={Constants.MOUSE_CIRCLE_PATH_STROKE_WIDTH}
                        // opacity={circleRadius / Constants.MOUSE_CIRCLE_RADIUS}
                    />

                    {/* Animated paths with triangles */}
                    {tempPaths.map(path => {
                        try {
                            const elements = path.getElements();
                            return (
                                <g key={path.id}>
                                    {elements.pathElement}
                                    {elements.triangleElement}
                                </g>
                            );
                        } catch (error) {
                            console.error("Error rendering path:", error);
                            return null;
                        }
                    })}
                    
                    {/* Gray floating spheres (previously red) */}
                    {redSpheres.map(sphere => {
                        try {
                            return sphere.getElement();
                        } catch (error) {
                            console.error("Error rendering sphere:", error);
                            return null;
                        }
                    })}
                    
                    {/* Burst circles for collision effects */}
                    {this.burstCircles && this.burstCircles.map(circle => {
                        try {
                            return (<g key={`burst-${circle.id}`}>
                                {circle.getElements()}
                            </g>);
                        } catch (error) {
                            console.error("Error rendering burst circle:", error);
                            return null;
                        }
                    })}
                </svg>
            </div>
        );
    }
}

export default BlankCanvas;

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
        this.setState({ tempPaths: paths });
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
    
    // Method to manually spawn a red sphere (for testing)
    spawnRedSphere = () => {
        if (this.redSphereController) {
            this.redSphereController.spawnRedSphere();
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
                        <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="10" result="blur" />
                            <feFlood floodColor="white" floodOpacity="1" result="glow" />
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
                    
                    {/* Red floating spheres */}
                    {redSpheres.map(sphere => {
                        try {
                            return sphere.getElement();
                        } catch (error) {
                            console.error("Error rendering red sphere:", error);
                            return null;
                        }
                    })}
                </svg>
            </div>
        );
    }
}

export default BlankCanvas;

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
            redSpheres: []
        };
        
        // Create the fixed triangle
        this.triangle = new Triangle(
            Constants.FIXED_TRIANGLE_X, 
            Constants.FIXED_TRIANGLE_Y, 
            Constants.TRIANGLE_WIDTH, 
            Constants.TRIANGLE_HEIGHT, 
            Constants.FIXED_TRIANGLE_ROTATION
        );
        
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
        this.redSphereController.updateTargetPosition(this.state.circleX);
    }
    
    componentDidUpdate(prevProps, prevState) {
        // Check for collisions between the keyboard circle and any red spheres
        if (this.redSphereController && 
           (prevState.circleX !== this.state.circleX || 
            prevState.redSpheres.length !== this.state.redSpheres.length)) {
            
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
            this.redSphereController.updateTargetPosition(x);
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
        
        // Create a new path
        const path = new Path(startX, startY, endX, endY, radius);
        
        // Add it to the animation controller
        this.animationController.addPath(path);
        
        // Force a re-render to show the new path
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
        // Create 8 paths in a circle pattern to create a "burst" effect
        const numberOfPaths = 8;
        const startX = this.state.circleX;
        const startY = this.height / 1.2; // Y position of the keyboard circle
        
        for (let i = 0; i < numberOfPaths; i++) {
            const angle = (i / numberOfPaths) * Math.PI * 2;
            const distance = 80 + Math.random() * 40; // Random distance between 80-120
            
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
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feFlood floodColor="#ff0000" floodOpacity="0.7" result="glow" />
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

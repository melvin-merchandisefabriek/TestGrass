import React, { useState, useEffect, useRef } from "react";

const CIRCLE_RADIUS = 30;
const MOUSE_CIRCLE_RADIUS = 32;
const MOVE_SPEED = 1; // Pixels per animation frame
const ACCELERATION_RATE = 30; // Lower = faster acceleration, higher = slower acceleration

// Path animation settings
const GRAVITY = 1.5; // Controls the arc height of the projectile path
// Note: Animation speed is now dynamically calculated based on circle radius:
// - Small radius = faster triangle movement
// - Large radius = slower triangle movement

// Simple interpolation function that halves or doubles until target is reached
// Speed parameter controls how quickly the value approaches the target (0.0-1.0)
// - Lower values = slower transition (e.g. 0.1 = very slow)
// - Higher values = faster transition (e.g. 0.9 = very fast)
// - Value of 1.0 = instant transition
const interpolateByHalvingOrDoubling = (current, target, speed = 0.5, tolerance = 0.1) => {
    // If we're already close enough to the target, return the target
    if (Math.abs(current - target) < tolerance) {
        return target;
    }
    
    // Clamp speed between 0 and 1
    const clampedSpeed = Math.max(0, Math.min(1, speed));
    // If current is less than target, increase it (with speed control)
    if (current < target) {
        // Calculate factor based on speed (higher speed = higher multiplier)
        const factor = 1 + clampedSpeed;
        const newValue = current * factor;
        return newValue > target ? target : newValue;
    } 
    // If current is greater than target, decrease it (with speed control)
    else {
        // Calculate divisor based on speed (higher speed = smaller divisor)
        const divisor = 1 + clampedSpeed;
        const newValue = current / divisor;
        return newValue < target ? target : newValue;
    }
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Helper function to calculate a point along a quadratic bezier curve
// t is a value between 0 and 1, representing progress along the curve
// Returns {x, y} coordinates of the point at position t along the curve
const getPointOnQuadraticCurve = (startX, startY, controlX, controlY, endX, endY, t) => {
    // Quadratic bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂ where 0 ≤ t ≤ 1
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    // Calculate the point coordinates
    const x = mt2 * startX + 2 * mt * t * controlX + t2 * endX;
    const y = mt2 * startY + 2 * mt * t * controlY + t2 * endY;
    
    return { x, y };
};

// Helper to calculate triangle points at a specific position with rotation
const getTrianglePoints = (x, y, width, height, rotation) => {
    // Base triangle points (centered at origin)
    const points = [
        { x: 0, y: -height/2 },          // Top point
        { x: width/2, y: height/2 },     // Bottom right
        { x: -width/2, y: height/2 }     // Bottom left
    ];
    
    // Rotate points
    const radians = (rotation * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    // Apply rotation and translation
    return points.map(p => ({
        x: (p.x * cos - p.y * sin) + x,
        y: (p.x * sin + p.y * cos) + y
    }));
};

export default function BlankCanvas({ width = 1000, height = 700 }) {
    const [circleX, setCircleX] = useState(width / 2);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [circleRadius, setCircleRadius] = useState(MOUSE_CIRCLE_RADIUS);
    const [tempPaths, setTempPaths] = useState([]); // Array to store temporary paths
    const keysPressed = useRef({});
    const animationFrameId = useRef(null);
    
    // Calculate the bezier path between circles with a projectile-like trajectory
    const getBezierPath = () => {
        // Starting point (keyboard-controlled circle)
        const startX = circleX;
        const startY = height / 1.2;
        
        // End point (mouse position)
        const endX = mousePosition.x;
        const endY = mousePosition.y;
        
        // Calculate vector from start to end
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate the arc height based on distance
        // Longer distances should have higher arcs
        const arcHeight = Math.min(distance * GRAVITY , 400 * (circleRadius/MOUSE_CIRCLE_RADIUS + 0.5));
        
        // Return the SVG path description
        // Use a quadratic Bezier curve with one control point (midway, arched up)
        const controlPointX = startX + dx / 2;
        const controlPointY = startY - arcHeight;
        return `M ${startX},${startY} Q ${controlPointX},${controlPointY} ${endX},${endY}`;
    };

    // Set up continuous movement based on key presses
    useEffect(() => {
        const moveCircle = () => {
            setCircleX(prevX => {
                let newX = prevX;
                
                // Left movement with A key
                if (keysPressed.current.a || keysPressed.current.A) {
                    // Increase speed if key is held down longer
                    const heldDuration = keysPressed.current.aHeldDuration || keysPressed.current.AHeldDuration || 0;
                    const speedMultiplier = 1 + Math.min(heldDuration / ACCELERATION_RATE, 4); // Up to 5x speed after ~150 frames
                    newX -= MOVE_SPEED * speedMultiplier;
                    // Track how long the key is held
                    keysPressed.current.aHeldDuration = (keysPressed.current.aHeldDuration || 0) + 1;
                    keysPressed.current.AHeldDuration = (keysPressed.current.AHeldDuration || 0) + 1;
                }
                
                // Right movement with D key
                if (keysPressed.current.d || keysPressed.current.D) {
                    // Increase speed if key is held down longer
                    const heldDuration = keysPressed.current.dHeldDuration || keysPressed.current.DHeldDuration || 0;
                    const speedMultiplier = 1 + Math.min(heldDuration / ACCELERATION_RATE, 4); // Up to 5x speed after ~150 frames
                    newX += MOVE_SPEED * speedMultiplier;
                    // Track how long the key is held
                    keysPressed.current.dHeldDuration = (keysPressed.current.dHeldDuration || 0) + 1;
                    keysPressed.current.DHeldDuration = (keysPressed.current.DHeldDuration || 0) + 1;
                }
                
                return clamp(newX, CIRCLE_RADIUS, width - CIRCLE_RADIUS);
            });
            animationFrameId.current = requestAnimationFrame(moveCircle);
        };

        const handleKeyDown = (e) => {
            if ((e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") && !keysPressed.current[e.key]) {
                keysPressed.current[e.key] = true;
                
                // Start animation if it's not already running
                if (animationFrameId.current === null) {
                    animationFrameId.current = requestAnimationFrame(moveCircle);
                }
            }
        };
        
        const handleKeyUp = (e) => {
            if (e.key === "a" || e.key === "A" || e.key === "d" || e.key === "D") {
                keysPressed.current[e.key] = false;
                
                // Reset held duration for the released key
                if (e.key === "a" || e.key === "A") {
                    keysPressed.current.aHeldDuration = 0;
                    keysPressed.current.AHeldDuration = 0;
                } else if (e.key === "d" || e.key === "D") {
                    keysPressed.current.dHeldDuration = 0;
                    keysPressed.current.DHeldDuration = 0;
                }
                
                // Stop animation if no movement keys are pressed
                if (!keysPressed.current.a && !keysPressed.current.A && 
                    !keysPressed.current.d && !keysPressed.current.D) {
                    cancelAnimationFrame(animationFrameId.current);
                    animationFrameId.current = null;
                }
            }
        };
        
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            if (animationFrameId.current !== null) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [width]);
    
    // Mouse movement tracking
    useEffect(() => {
        const handleMouseMove = (e) => {
            // Get the SVG element's position
            const svg = document.querySelector('svg');
            if (svg) {
                const rect = svg.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Only update if mouse is within SVG boundaries
                if (x >= 0 && x <= width && y >= 0 && y <= height) {
                    setMousePosition({ x, y });
                }
            }
        };
        
        const handleMouseDown = () => {
            setIsMouseDown(true);
        };
        
        const handleMouseUp = () => {
            // Only create a temporary path if the mouse was previously down
            if (isMouseDown) {
                // Calculate path parameters for trajectory
                const startX = circleX;
                const startY = height / 1.2;
                const endX = mousePosition.x;
                const endY = mousePosition.y;
                
                // Calculate vector and control point
                const dx = endX - startX;
                const dy = endY - startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const arcHeight = Math.min(distance * GRAVITY, 400 * (circleRadius/MOUSE_CIRCLE_RADIUS + 0.5));
                const controlPointX = startX + dx / 2;
                const controlPointY = startY - arcHeight;
                
                // Save current trajectory data
                const currentPath = getBezierPath();
                
                // Generate a unique ID for this path
                const pathId = Date.now() + Math.random().toString(36).substr(2, 9);
                
                // Create a temporary copy of the current trajectory path
                const newTempPath = {
                    id: pathId, // Unique ID for this path
                    path: currentPath, // Current path at the time of mouse release
                    opacity: 0.8, // Start with high opacity
                    timestamp: Date.now(), // Track when it was created
                    progress: 0, // Progress of the triangle along the path (0 to 1)
                    // Store the circle radius at the time of firing for speed calculation
                    radius: circleRadius,
                    // Store the control points for bezier calculations
                    points: {
                        startX, 
                        startY,
                        controlPointX,
                        controlPointY,
                        endX,
                        endY
                    }
                };
                
                // Add the new path to existing paths without disrupting ongoing animations
                if (animatedPathsRef.current.animationFrame) {
                    // If animation is already running, add to the ref directly
                    animatedPathsRef.current.paths = [...animatedPathsRef.current.paths, newTempPath];
                    // Also update state to keep UI in sync
                    setTempPaths(prev => [...prev, newTempPath]);
                } else {
                    // If no animation is running, just update the state
                    setTempPaths(prev => [...prev, newTempPath]);
                }
            }
            
            setIsMouseDown(false);
        };
        
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [width, height, circleX, circleRadius, isMouseDown]);
    
    // Animate circle radius using our interpolation function
    useEffect(() => {
        const targetRadius = isMouseDown ? 2 : MOUSE_CIRCLE_RADIUS;
        
        const animateRadius = () => {
            setCircleRadius(prevRadius => {
                // Use a speed of 0.2 for a moderately slow, smooth transition
                const newRadius = interpolateByHalvingOrDoubling(prevRadius, targetRadius, isMouseDown ? 0.015 : 0.2, 0.1);
                
                // If we're very close to the target, just set it directly
                if (Math.abs(newRadius - targetRadius) < 0.1) {
                    return targetRadius;
                }
                
                return newRadius;
            });
            
            radiusAnimationRef.current = requestAnimationFrame(animateRadius);
        };
        
        // Store animation reference for cleanup
        const radiusAnimationRef = { current: null };
        radiusAnimationRef.current = requestAnimationFrame(animateRadius);
        
        return () => {
            if (radiusAnimationRef.current) {
                cancelAnimationFrame(radiusAnimationRef.current);
            }
        };
    }, [isMouseDown]);

    // Animation refs
    const animatedPathsRef = useRef({
        paths: [],
        timestamp: 0,
        animationFrame: null
    });

    // Function to animate the paths with triangles
    const animateTriangles = useRef();
    
    // Define the animation function in useEffect to ensure stability
    useEffect(() => {
        // Define the animation function
        animateTriangles.current = (timestamp) => {
            // Skip if there are no paths
            if (animatedPathsRef.current.paths.length === 0) {
                animatedPathsRef.current.animationFrame = null;
                return;
            }
            
            // Time tracking for smooth animation
            if (!animatedPathsRef.current.timestamp) {
                animatedPathsRef.current.timestamp = timestamp;
            }
            
            // Calculate actual elapsed time since last frame
            const elapsed = timestamp - animatedPathsRef.current.timestamp;
            animatedPathsRef.current.timestamp = timestamp;
            
            // Update paths using elapsed time for smooth motion
            const now = Date.now();
            const updatedPaths = [];
            
            // Process each path independently
            animatedPathsRef.current.paths.forEach(path => {
                // Calculate animation duration based on circle radius when fired
                // Base duration is 500ms, adjust by radius factor
                // - Smaller radius = faster animation (shorter duration)
                // - Larger radius = slower animation (longer duration)
                const baseAnimDuration = 100; // Base animation duration in ms
                // Clamp the radius for speed calculation to avoid extremes
                
                // Create a more pronounced effect by squaring the ratio
                
                // Calculate animation duration: 
                // - At default radius (32), duration = 500ms
                // - At smaller radius, duration decreases (faster)
                // - At larger radius, duration increases (slower)
                const animDuration = baseAnimDuration * (path.radius/2 + 2.5);
                
                const age = now - path.timestamp;
                
                // Remove if animation is complete
                if (age >= animDuration) return;
                
                // Calculate opacity and progress based on exact age
                // Ensure each path's animation is based on its own timestamp
                const opacity = 0.8 * (1 - age / animDuration);
                
                // Use elapsed time for smoother motion for each path individually
                const progress = Math.min(age / animDuration, 1);
                
                updatedPaths.push({
                    ...path,
                    opacity,
                    progress
                });
            });
            
            // Store updated paths in ref for next frame
            animatedPathsRef.current.paths = updatedPaths;
            
            // Force a re-render only when necessary
            if (updatedPaths.length > 0) {
                setTempPaths([...updatedPaths]);
            } else {
                setTempPaths([]);
            }
            
            // Request next frame if we still have paths
            if (updatedPaths.length > 0) {
                animatedPathsRef.current.animationFrame = requestAnimationFrame(animateTriangles.current);
            } else {
                animatedPathsRef.current.animationFrame = null;
            }
        };
        
        return () => {
            // Clean up animation when the effect is cleaned up
            if (animatedPathsRef.current.animationFrame) {
                cancelAnimationFrame(animatedPathsRef.current.animationFrame);
                animatedPathsRef.current.animationFrame = null;
            }
        };
    }, []); // Empty dependency array ensures this only runs once
    
    // Effect to handle path creation and kick off animation
    useEffect(() => {
        // Start animation if we have paths and no animation is running
        if (tempPaths.length > 0 && !animatedPathsRef.current.animationFrame) {
            // Store paths in ref to avoid state reading during animation
            animatedPathsRef.current.paths = tempPaths;
            // Reset the timestamp to ensure smooth start
            animatedPathsRef.current.timestamp = 0;
            // Start the animation loop
            animatedPathsRef.current.animationFrame = requestAnimationFrame(animateTriangles.current);
        } 
        // If animation is already running, just update the path collection
        else if (tempPaths.length > 0 && animatedPathsRef.current.animationFrame) {
            // Merge the new paths with existing ones, preserving animations in progress
            const existingPaths = animatedPathsRef.current.paths;
            const newPaths = tempPaths.filter(newPath => 
                !existingPaths.some(existingPath => existingPath.id === newPath.id)
            );
            
            // Add new paths to the existing animation
            if (newPaths.length > 0) {
                animatedPathsRef.current.paths = [...existingPaths, ...newPaths];
            }
        }
    }, [tempPaths.length]);

    const triangleX = 10; // Fixed X position for triangle
    const triangleY = 10; // Fixed Y position for triangle
    const triangleBaseWidth = 6; // Base width of the triangle
    const triangleHeight = 10; // Height of the triangle
    const triangleRotation = 50; // No rotation for the triangle
    // Calculate triangle points based on fixed position and dimensions
    // Note: The triangle is positioned at the top left corner (10, 10) with a base width of 80 and height of 70
    // The triangle points are calculated relative to this position
    // Triangle points based on fixed position and dimensions
    const trianglePoints = [
        { x: triangleX + triangleBaseWidth / 2, y: triangleY }, // Top point
        { x: triangleX + triangleBaseWidth, y: triangleY + triangleHeight }, // Bottom right point
        { x: triangleX, y: triangleY + triangleHeight } // Bottom left point
    ];
    // Ensure triangle points are rotated around the center if needed
    if (triangleRotation !== 0) {
        const radians = (triangleRotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        trianglePoints.forEach(p => {
            const x = p.x - (triangleX + triangleBaseWidth / 2);
            const y = p.y - (triangleY + triangleHeight / 2);
            p.x = x * cos - y * sin + (triangleX + triangleBaseWidth / 2);
            p.y = x * sin + y * cos + (triangleY + triangleHeight / 2);
        });
    }


    return (
        <div style={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center",
            paddingTop: 20,
            width: "100%"
        }}>
            <svg
                width={width}
                height={height}
                style={{
                    background: "#3498db",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    borderRadius: 4,
                    cursor: "none", // Hide the cursor
                }}
            >
                {/* Original keyboard-controlled circle */}
                <circle
                    cx={circleX}
                    cy={height / 1.2}
                    r={CIRCLE_RADIUS}
                    fill="#fff"
                    stroke="none"
                    strokeWidth={5}
                />
                
                {/* Mouse follower circle */}
                <circle
                    cx={mousePosition.x}
                    cy={mousePosition.y}
                    r={circleRadius}
                    fill="none"
                    stroke="#fff"
                    strokeWidth={3 * circleRadius / MOUSE_CIRCLE_RADIUS + 1}
                    opacity={0.5 / (circleRadius / MOUSE_CIRCLE_RADIUS * 2)}
                />

                {/* Triangle shape */}
                <polygon
                    points={trianglePoints.map(p => `${p.x},${p.y}`).join(" ")}
                    fill="#999999"
                    stroke="#fff"
                    strokeWidth={1}
                />

                {/* Temporary paths with animated triangles */}
                {tempPaths.map(path => {
                    // Calculate the position of the triangle along the curve
                    const { startX, startY, controlPointX, controlPointY, endX, endY } = path.points;
                    const trianglePos = getPointOnQuadraticCurve(
                        startX, startY, 
                        controlPointX, controlPointY, 
                        endX, endY, 
                        path.progress
                    );
                    
                    // Calculate direction to point triangle along the curve
                    // Get the tangent to the curve at this point to determine rotation
                    const nextPoint = getPointOnQuadraticCurve(
                        startX, startY, 
                        controlPointX, controlPointY, 
                        endX, endY, 
                        Math.min(path.progress + 0.01, 1)
                    );
                    
                    // Calculate angle based on direction
                    const angle = Math.atan2(
                        nextPoint.y - trianglePos.y, 
                        nextPoint.x - trianglePos.x
                    ) * (180 / Math.PI);
                    
                    // Generate triangle points
                    const pathTrianglePoints = getTrianglePoints(
                        trianglePos.x, 
                        trianglePos.y, 
                        triangleBaseWidth, 
                        triangleHeight, 
                        angle + 90 // Adjust angle to point in direction of movement
                    );
                    
                    return (
                        <g key={path.id}>
                            {/* The path itself */}
                            <path
                                d={path.path}
                                fill="none"
                                stroke="#ffffff"
                                strokeWidth={1}
                                opacity={path.opacity*0.1}
                            />
                            
                            {/* Triangle moving along the path */}
                            <polygon
                                points={pathTrianglePoints.map(p => `${p.x},${p.y}`).join(" ")}
                                fill="#ffffff"
                                stroke="none"
                                opacity={path.opacity * 1.2}
                            />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

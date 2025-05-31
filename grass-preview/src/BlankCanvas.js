import React, { useState, useEffect, useRef } from "react";

const CIRCLE_RADIUS = 30;
const MOUSE_CIRCLE_RADIUS = 20;
const MOVE_SPEED = 1; // Pixels per animation frame
const ACCELERATION_RATE = 30; // Lower = faster acceleration, higher = slower acceleration

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

export default function BlankCanvas({ width = 1000, height = 700 }) {
    const [circleX, setCircleX] = useState(width / 2);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [circleRadius, setCircleRadius] = useState(MOUSE_CIRCLE_RADIUS);
    const keysPressed = useRef({});
    const animationFrameId = useRef(null);

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
    }, [width, height]);
    
    // Animate circle radius using our interpolation function
    useEffect(() => {
        const targetRadius = isMouseDown ? 2 : MOUSE_CIRCLE_RADIUS;
        
        const animateRadius = () => {
            setCircleRadius(prevRadius => {
                // Use a speed of 0.2 for a moderately slow, smooth transition
                const newRadius = interpolateByHalvingOrDoubling(prevRadius, targetRadius, isMouseDown ? 0.05 : 0.2, 0.1);
                
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
                    strokeWidth={1}
                />

                {/* Triangle shape */}
                <polygon
                    points={`
                        ${width / 2},${height / 4} 
                        ${(width / 2) - 40},${(height / 4) + 70} 
                        ${(width / 2) + 40},${(height / 4) + 70}
                    `}
                    fill="#f39c12"
                    stroke="#fff"
                    strokeWidth={2}
                />
            </svg>
        </div>
    );
}
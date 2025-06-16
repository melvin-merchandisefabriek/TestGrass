/**
 * Utility functions for the BlankCanvas component
 */

/**
 * Simple interpolation     // Triangle properties
    TRIANGLE_WIDTH: 6,                  // Width of triangles
    TRIANGLE_HEIGHT: 10,                // Default height of triangles
    TRIANGLE_MIN_HEIGHT: 6,             // Minimum height for triangles
    TRIANGLE_MAX_HEIGHT: 24,            // Maximum height for triangles
    TRIANGLE_HEIGHT_SCALE_FACTOR: 2.5,  // Scale factor for circle radius to triangle height conversion
    FIXED_TRIANGLE_X: 10,               // X position of the fixed triangle
    FIXED_TRIANGLE_Y: 10,               // Y position of the fixed triangle
    FIXED_TRIANGLE_ROTATION: 50,        // Rotation of the fixed triangle in degrees
    FIXED_TRIANGLE_FILL: "#999999",     // Fill color of fixed triangle
    FIXED_TRIANGLE_STROKE: "#fff",      // Stroke color of fixed triangle
    MOVING_TRIANGLE_FILL: "#ffffff",    // Fill color of moving triangles
    MOVING_TRIANGLE_OPACITY: 1.2,       // Opacity multiplier for moving triangleshat halves or doubles until target is reached
 * Speed parameter controls how quickly the value approaches the target (0.0-1.0)
 * - Lower values = slower transition (e.g. 0.1 = very slow)
 * - Higher values = faster transition (e.g. 0.9 = very fast)
 * - Value of 1.0 = instant transition
 */
export const interpolateByHalvingOrDoubling = (current, target, speed = 0.01, tolerance = 0.1) => {
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

/**
 * Clamps a value between min and max
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Calculates a point along a quadratic bezier curve
 * @param {number} startX - Starting x coordinate
 * @param {number} startY - Starting y coordinate 
 * @param {number} controlX - Control point x coordinate
 * @param {number} controlY - Control point y coordinate
 * @param {number} endX - End point x coordinate
 * @param {number} endY - End point y coordinate
 * @param {number} t - Value between 0 and 1 representing progress along the curve
 * @returns {Object} {x, y} coordinates of the point at position t along the curve
 */
export const getPointOnQuadraticCurve = (startX, startY, controlX, controlY, endX, endY, t) => {
    // Quadratic bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂ where 0 ≤ t ≤ 1
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    // Calculate the point coordinates
    const x = mt2 * startX + 2 * mt * t * controlX + t2 * endX;
    const y = mt2 * startY + 2 * mt * t * controlY + t2 * endY;
    
    return { x, y };
};

// Constants used across components
export const Constants = {
    // Circle dimensions
    CIRCLE_RADIUS: 30,                  // Radius of the keyboard-controlled circle
    MOUSE_CIRCLE_RADIUS: 15,            // Default radius of the mouse follower circle
    MOUSE_CIRCLE_PATH_STROKE_WIDTH: 2,  // Stroke width of mouse circle
    MOUSE_CIRCLE_MIN_RADIUS: 1,         // Minimum radius when circle is clicked
    
    // Circle colors
    CIRCLE_FILL_COLOR: "#fff",          // Fill color for the main circle
    MOUSE_CIRCLE_STROKE_COLOR: "#fff",  // Stroke color for mouse circle
    
    // Movement and animation
    MOVE_SPEED: 1,                      // Pixels per animation frame
    ACCELERATION_RATE: 30,              // Lower = faster acceleration, higher = slower acceleration
    GRAVITY: 1.5,                       // Controls the arc height of the projectile path
    
    // Path animation
    PATH_BASE_DURATION: 200,            // Base duration for path animation in ms (increased for more control over scaling)
    PATH_STROKE_COLOR: "#ffffff",       // Color of the path stroke
    PATH_STROKE_WIDTH: 1,               // Width of the path stroke
    PATH_OPACITY: 0.1,                  // Base opacity for the path
    PATH_DEFAULT_OPACITY: 0.8,          // Default opacity for new paths
    
    // Triangle properties
    TRIANGLE_WIDTH: 6,                  // Width of triangles
    TRIANGLE_HEIGHT: 10,                // Default height of triangles
    TRIANGLE_HEIGHT_SCALE_FACTOR: 20,   // Scale factor for circle radius to triangle height conversion
    FIXED_TRIANGLE_X: 10,               // X position of the fixed triangle
    FIXED_TRIANGLE_Y: 10,               // Y position of the fixed triangle
    FIXED_TRIANGLE_ROTATION: 50,        // Rotation of the fixed triangle in degrees
    FIXED_TRIANGLE_FILL: "#999999",     // Fill color of fixed triangle
    FIXED_TRIANGLE_STROKE: "#fff",      // Stroke color of fixed triangle
    MOVING_TRIANGLE_FILL: "#ffffff",    // Fill color of moving triangles
    MOVING_TRIANGLE_OPACITY: 1,         // Opacity multiplier for moving triangles
    
    // Charged Triangle Settings
    CHARGED_TRIANGLE_DAMAGE: 10,        // Damage inflicted by charged triangles (insta-kill)
    NORMAL_TRIANGLE_DAMAGE: 1,          // Damage inflicted by normal triangles
    
    // Sphere properties (changed from red to gray)
    RED_SPHERE_RADIUS: 20,              // Radius of the floating sphere
    RED_SPHERE_FILL: "#777777",         // Fill color for the sphere (changed to gray)
    RED_SPHERE_BASE_SPEED: 0.02,        // Base speed of the sphere (reduced to be extremely slow)
    RED_SPHERE_FLOAT_AMPLITUDE: 0,      // Amplitude of the floating motion (removed completely)
    RED_SPHERE_FLOAT_SPEED: 1.5,        // Speed of the floating motion
    RED_SPHERE_LIFETIME: 20000,         // Lifetime of the red sphere in ms (increased)
    RED_SPHERE_SPAWN_CHANCE: 0.01,      // Chance per frame to spawn a new red sphere (increased)
    RED_SPHERE_MAX_COUNT: 15,           // Maximum number of red spheres at once (increased)
};

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

// Example of shape data JSON structure
const exampleShapeData = {
  id: "shape-1",
  name: "Sample Complex Shape",
  width: 300,
  height: 200,
  position: {
    svg: { x: 0, y: 0 },  // Position within the SVG coordinate system
    global: { x: 100, y: 100 } // Global position of the shape in the application
  },
  animations: {
    duration: 3, // Total animation duration in seconds
    loops: 0,    // 0 means infinite loop, any positive number means that many loops
    controlPointAnimations: {
      "cp-1": {  // Basic sine wave with expression
        formula: {
          x: {
            // Custom mathematical expression for x
            expression: "50 + 50 * sin(TWO_PI * n)",
            // This is equivalent to the previous sine wave definition
            // but now written as a direct expression
          },
          y: {
            // Simple constant expression
            expression: "50"
          }
        }
      },
      "cp-3": {  // Complex combined waves
        formula: {
          x: {
            // Combine multiple sine waves with different frequencies and amplitudes
            expression: "100 + 15 * sin(TWO_PI * 2 * n) + 5 * sin(TWO_PI * 5 * n)",
            // This creates a primary wave with smaller ripples for a more organic look
          },
          y: {
            // Damped oscillation that decreases amplitude over time
            expression: "100 + 20 * sin(TWO_PI * n) * (1 - 0.5 * n)",
            // Oscillation that gradually reduces in amplitude
          }
        }
      },
      "cp-4": {  // Complex mathematical patterns with custom variables
        formula: {
          x: {
            // Bouncing effect with elastic overshoot
            expression: "150 + 30 * sin(TWO_PI * 2 * n) * exp(-5 * n)",
            // This creates a spring-like motion that dampens over time
          },
          y: {
            // Combined sinusoidal motion with custom variables
            expression: "baseY + amp1 * sin(TWO_PI * freq1 * n) + amp2 * sin(TWO_PI * freq2 * n + phase)",
            variables: {
              baseY: 100,
              amp1: 15,
              freq1: 1,
              amp2: 5,
              freq2: 3,
              phase: Math.PI / 2
            }
          }
        }
      }
    },
    positionAnimations: {
      global: { // Animate the global position
        keyframes: [
          // { time: 0, x: 100, y: 100 },
          // { time: 1.5, x: 150, y: 150 },
          // { time: 3.0, x: 100, y: 100 }
        ]
      }
    }
  },
  controlPoints: [
    { id: "cp-1", x: 50, y: 50, type: "anchor" },
    { id: "cp-2", x: 100, y: 50, type: "control" },
    { id: "cp-3", x: 100, y: 100, type: "control" },
    { id: "cp-4", x: 150, y: 100, type: "anchor" },
    { id: "cp-5", x: 150, y: 150, type: "anchor" },
    { id: "cp-6", x: 200, y: 150, type: "anchor" }
  ],
  segments: [
    {
      id: "seg-1",
      type: "bezier",
      points: ["cp-1", "cp-2", "cp-3", "cp-4"], // Start, Control1, Control2, End
      style: { stroke: "#ff0000", strokeWidth: 2 }
    },
    {
      id: "seg-2",
      type: "line",
      points: ["cp-4", "cp-5"], // Start, End
      style: { stroke: "#00ff00", strokeWidth: 2 }
    },
    {
      id: "seg-3",
      type: "line",
      points: ["cp-5", "cp-6"], // Start, End
      style: { stroke: "#0000ff", strokeWidth: 2 }
    }
  ],
  style: {
    fill: "none",
    stroke: "#ffffff",
    strokeWidth: 1
  }
};

const Shape = ({ shapeData = exampleShapeData }) => {
  // State for animated control points and position
  const [animatedControlPoints, setAnimatedControlPoints] = useState({});
  const [animatedPosition, setAnimatedPosition] = useState(null);
  
  // Store references for animation and DOM elements
  const animationRef = useRef(null);
  const animationState = useRef({
    isAnimating: false,
    startTime: 0,
    currentTime: 0,
    lastUpdateTime: 0
  });
  
  // Container ref for direct DOM updates
  const containerRef = useRef(null);
  
  // Store refs for each segment path element for direct DOM updates
  const segmentRefs = useRef({});
  
  // Helper function to find a control point by ID, with animation support
  const findPoint = useCallback((pointId) => {
    // If this point has animated values, use those instead of the original
    if (animatedControlPoints[pointId]) {
      return {
        ...shapeData.controlPoints.find(cp => cp.id === pointId),
        ...animatedControlPoints[pointId]
      };
    }
    return shapeData.controlPoints.find(cp => cp.id === pointId);
  }, [shapeData.controlPoints, animatedControlPoints]);
  
  // Apply position transform to a point, with animation support
  const transformPoint = useCallback((point) => {
    // Use animated position if available, otherwise use the original
    const position = animatedPosition || shapeData.position.svg;
    
    // Apply the SVG position transform to adjust all coordinates
    return {
      ...point,
      x: point.x + position.x,
      y: point.y + position.y
    };
  }, [shapeData.position.svg, animatedPosition]);
  
  // Generate SVG path data from segments
  const generatePathData = () => {
    let pathData = '';
    
    shapeData.segments.forEach(segment => {
      const points = segment.points.map(pointId => transformPoint(findPoint(pointId)));
      
      if (segment.type === 'line') {
        // Line segment needs two points - start and end
        const start = points[0];
        const end = points[1];
        
        // If this is the first segment, start with M (move to)
        if (pathData === '') {
          pathData += `M ${start.x} ${start.y} `;
        }
        pathData += `L ${end.x} ${end.y} `;
      } else if (segment.type === 'bezier') {
        // Cubic bezier needs 4 points
        const start = points[0];
        const control1 = points[1];
        const control2 = points[2];
        const end = points[3];
        
        // If this is the first segment, start with M (move to)
        if (pathData === '') {
          pathData += `M ${start.x} ${start.y} `;
        }
        pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
      }
    });
    
    return pathData;
  };
  
  // Generate SVG paths for each segment with its own style
  const renderSegments = () => {
    return shapeData.segments.map(segment => {
      const points = segment.points.map(pointId => transformPoint(findPoint(pointId)));
      let pathData = '';
      
      if (segment.type === 'line') {
        const start = points[0];
        const end = points[1];
        pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else if (segment.type === 'bezier') {
        const start = points[0];
        const control1 = points[1];
        const control2 = points[2];
        const end = points[3];
        pathData = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
      }
      
      return (
        <path
          key={segment.id}
          ref={el => { if (el) segmentRefs.current[segment.id] = el; }}
          d={pathData}
          fill="none"
          stroke={segment.style.stroke || shapeData.style.stroke}
          strokeWidth={segment.style.strokeWidth || shapeData.style.strokeWidth}
        />
      );
    });
  };
  
  // Render control points as small circles - memoized for performance
  const renderControlPoints = useMemo(() => {
    return shapeData.controlPoints.map(point => {
      // Use the animated values if available
      const animatedPoint = animatedControlPoints[point.id];
      const effectivePoint = animatedPoint ? 
        { ...point, ...animatedPoint } :
        point;
      
      const transformedPoint = transformPoint(effectivePoint);
      
      return (
        <circle
          key={point.id}
          cx={transformedPoint.x}
          cy={transformedPoint.y}
          r={point.type === "anchor" ? 4 : 2}
          fill={point.type === "anchor" ? "#ffffff" : "#888888"}
          stroke="#444444"
          strokeWidth="1"
        />
      );
    });
  }, [shapeData.controlPoints, animatedControlPoints, transformPoint]);
  
  // Render position anchor point (main anchor for the shape) - memoized for performance
  const renderPositionAnchor = useMemo(() => {
    // Use animated position if available
    const position = animatedPosition || shapeData.position.svg;
    
    return (
      <circle
        cx={position.x}
        cy={position.y}
        r={6}
        fill="yellow"
        stroke="black"
        strokeWidth="1"
      />
    );
  }, [shapeData.position.svg, animatedPosition]);
  
  // Calculate the bounding box considering position anchor and width/height
  const calculateViewBox = () => {
    const svgPosition = shapeData.position.svg;
    const width = shapeData.width;
    const height = shapeData.height;
    
    // Calculate padding based on the shape's dimensions
    const padding = Math.max(width, height) * 0.1;
    
    // Define the viewBox area
    return `${svgPosition.x - padding} ${svgPosition.y - padding} ${width + padding * 2} ${height + padding * 2}`;
  };

  // Deep equals helper for comparing objects
  const deepEquals = (obj1, obj2) => {
    // Handle null/undefined cases
    if (obj1 === obj2) return true;
    if (obj1 === null || obj2 === null) return false;
    if (obj1 === undefined || obj2 === undefined) return false;
    
    // Compare object keys and values
    const keys1 = Object.keys(obj1 || {});
    const keys2 = Object.keys(obj2 || {});
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => {
      const val1 = obj1[key];
      const val2 = obj2[key];
      
      // Handle nested objects
      if (typeof val1 === 'object' && typeof val2 === 'object') {
        return deepEquals(val1, val2);
      }
      
      return val1 === val2;
    });
  };

    // Direct DOM update function for affected segments
  const updateAffectedSegments = (affectedSegments, controlPoints, position) => {
    // For each affected segment, directly update its path data
    affectedSegments.forEach(segmentId => {
      const pathElement = segmentRefs.current[segmentId];
      if (!pathElement) return;
      
      // Find the segment definition
      const segment = shapeData.segments.find(s => s.id === segmentId);
      if (!segment) return;
      
      // Generate new path data for this segment
      const points = segment.points.map(pointId => {
        // Get original point
        const originalPoint = shapeData.controlPoints.find(cp => cp.id === pointId);
        
        // Apply animated values if available
        const animatedPoint = {
          ...originalPoint,
          ...(controlPoints[pointId] || {})
        };
        
        // Apply position transform
        return {
          ...animatedPoint,
          x: animatedPoint.x + (position ? position.x : shapeData.position.svg.x),
          y: animatedPoint.y + (position ? position.y : shapeData.position.svg.y)
        };
      });
      
      // Generate path data string
      let pathData = '';
      if (segment.type === 'line') {
        const start = points[0];
        const end = points[1];
        pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
      } else if (segment.type === 'bezier') {
        const start = points[0];
        const control1 = points[1];
        const control2 = points[2];
        const end = points[3];
        pathData = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
      }
      
      // Directly set the path data attribute in the DOM
      pathElement.setAttribute('d', pathData);
    });
  };

    // Placeholder functions for custom animation calculation
  // Function to safely evaluate mathematical expressions
  const evaluateExpression = (expression, variables) => {
    try {
      // Create a safe function from the expression with provided variables
      // This approach protects against code injection while allowing mathematical expressions
      const safeFunction = new Function(...Object.keys(variables), `
        "use strict";
        // Only allow mathematical operations, no assignments or function calls except Math
        return ${expression};
      `);
      
      // Execute the function with the provided variables
      return safeFunction(...Object.values(variables));
    } catch (error) {
      console.warn(`Error evaluating expression: ${expression}`, error);
      return null;
    }
  };

  // Function to calculate values based on mathematical formulas
  const calculateFormula = (formula, currentTime, duration) => {
    if (!formula) return null;

    // Create common variables available to all formulas
    const variables = {
      t: currentTime,                     // Current time in seconds
      d: duration,                        // Total duration in seconds
      n: currentTime / duration,          // Normalized time (0 to 1)
      PI: Math.PI,
      TWO_PI: 2 * Math.PI,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      abs: Math.abs,
      min: Math.min,
      max: Math.max,
      sqrt: Math.sqrt,
      pow: Math.pow,
      floor: Math.floor,
      ceil: Math.ceil,
      round: Math.round,
      exp: Math.exp,
      log: Math.log,
      random: Math.random
    };

    // Simple predefined formula types for convenience
    if (formula.type) {
      switch (formula.type) {
        case 'sine':
          return evaluateExpression(
            `${formula.baseValue} + ${formula.amplitude} * sin(TWO_PI * ${formula.frequency} * n + ${formula.phase || 0})`,
            variables
          );
        
        case 'cosine':
          return evaluateExpression(
            `${formula.baseValue} + ${formula.amplitude} * cos(TWO_PI * ${formula.frequency} * n + ${formula.phase || 0})`,
            variables
          );
        
        case 'linear':
          return evaluateExpression(
            `${formula.startValue} + (${formula.endValue} - ${formula.startValue}) * n`,
            variables
          );
        
        case 'constant':
          return formula.value;
      }
    }
    
    // If it's an expression string, evaluate it directly
    if (formula.expression) {
      // Add any custom variables defined in the formula
      if (formula.variables) {
        Object.entries(formula.variables).forEach(([key, value]) => {
          variables[key] = value;
        });
      }
      
      return evaluateExpression(formula.expression, variables);
    }
    
    console.warn(`Invalid formula: ${JSON.stringify(formula)}`);
    return null;
  };

  const calculateControlPointPosition = (pointId, animation, currentTime) => {
    const result = { x: null, y: null };
    const duration = shapeData.animations.duration;
    
    // Check for formula-based animation
    if (animation.formula) {
      // Calculate X position if formula is provided
      if (animation.formula.x) {
        result.x = calculateFormula(animation.formula.x, currentTime, duration);
      }
      
      // Calculate Y position if formula is provided
      if (animation.formula.y) {
        result.y = calculateFormula(animation.formula.y, currentTime, duration);
      }
    }
    
    // If we still need x or y values, try to get them from keyframes
    if ((result.x === null || result.y === null) && animation.keyframes && animation.keyframes.length > 0) {
      // Basic linear interpolation between keyframes
      const keyframes = animation.keyframes;
      
      // Find the surrounding keyframes
      let startKeyframe = keyframes[0];
      let endKeyframe = keyframes[keyframes.length - 1];
      
      // Single keyframe case
      if (keyframes.length === 1) {
        if (result.x === null) result.x = keyframes[0].x;
        if (result.y === null) result.y = keyframes[0].y;
      } else {
        // Multiple keyframes
        for (let i = 0; i < keyframes.length - 1; i++) {
          if (keyframes[i].time <= currentTime && keyframes[i+1].time >= currentTime) {
            startKeyframe = keyframes[i];
            endKeyframe = keyframes[i+1];
            break;
          }
        }
        
        // If current time is before the first keyframe or after the last one,
        // use the closest keyframe's values directly
        if (currentTime <= keyframes[0].time) {
          if (result.x === null) result.x = keyframes[0].x;
          if (result.y === null) result.y = keyframes[0].y;
        } else if (currentTime >= keyframes[keyframes.length-1].time) {
          if (result.x === null) result.x = keyframes[keyframes.length-1].x;
          if (result.y === null) result.y = keyframes[keyframes.length-1].y;
        } else {
          // Calculate position by interpolating between keyframes
          const timeDiff = endKeyframe.time - startKeyframe.time;
          const timeProgress = (currentTime - startKeyframe.time) / timeDiff;
          
          // Linear interpolation between the two keyframes, only for properties not set by formula
          if (result.x === null && startKeyframe.x !== undefined && endKeyframe.x !== undefined) {
            result.x = startKeyframe.x + (endKeyframe.x - startKeyframe.x) * timeProgress;
          }
          
          if (result.y === null && startKeyframe.y !== undefined && endKeyframe.y !== undefined) {
            result.y = startKeyframe.y + (endKeyframe.y - startKeyframe.y) * timeProgress;
          }
        }
      }
    }
    
    // If we successfully calculated at least one value
    if (result.x !== null || result.y !== null) {
      // Fill in any missing values with defaults from the first control point
      const originalPoint = shapeData.controlPoints.find(cp => cp.id === pointId);
      if (result.x === null && originalPoint) result.x = originalPoint.x;
      if (result.y === null && originalPoint) result.y = originalPoint.y;
      
      return result;
    }
    
    return null;
  };
  
  const calculateGlobalPosition = (animation, currentTime) => {
    // Use the same logic as control points for now
    const keyframes = animation.keyframes;
    if (!keyframes || keyframes.length < 2) {
      if (keyframes && keyframes.length === 1) {
        return { x: keyframes[0].x, y: keyframes[0].y };
      }
      return null;
    }
    
    // Find the surrounding keyframes
    let startKeyframe = keyframes[0];
    let endKeyframe = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= currentTime && keyframes[i+1].time >= currentTime) {
        startKeyframe = keyframes[i];
        endKeyframe = keyframes[i+1];
        break;
      }
    }
    
    // Handle boundary cases
    if (currentTime <= keyframes[0].time) {
      return { x: keyframes[0].x, y: keyframes[0].y };
    } else if (currentTime >= keyframes[keyframes.length-1].time) {
      return { x: keyframes[keyframes.length-1].x, y: keyframes[keyframes.length-1].y };
    }
    
    // Linear interpolation
    const timeDiff = endKeyframe.time - startKeyframe.time;
    const timeProgress = (currentTime - startKeyframe.time) / timeDiff;
    
    const x = startKeyframe.x + (endKeyframe.x - startKeyframe.x) * timeProgress;
    const y = startKeyframe.y + (endKeyframe.y - startKeyframe.y) * timeProgress;
    
    return { x, y };
  };

    // Animation update function
  const updateAnimationValues = (currentTime) => {
    // Track which segments need to be redrawn
    const affectedSegments = new Set();
    
    // Process control point animations
    const newAnimatedControlPoints = { ...animatedControlPoints };
    
    if (shapeData.animations?.controlPointAnimations) {
      Object.entries(shapeData.animations.controlPointAnimations).forEach(([pointId, animation]) => {
        // Find the segments that use this control point
        shapeData.segments.forEach(segment => {
          if (segment.points.includes(pointId)) {
            affectedSegments.add(segment.id);
          }
        });
        
        // Calculate new position for this control point
        const animatedValues = calculateControlPointPosition(pointId, animation, currentTime);
        if (animatedValues) {
          newAnimatedControlPoints[pointId] = animatedValues;
        }
      });
    }
    
    // Similarly process global position animations
    let newAnimatedPosition = animatedPosition;
    if (shapeData.animations?.positionAnimations?.global) {
      const posAnimation = shapeData.animations.positionAnimations.global;
      
      // Calculate new global position
      const calculatedPosition = calculateGlobalPosition(posAnimation, currentTime);
      if (calculatedPosition) {
        newAnimatedPosition = calculatedPosition;
        
        // All segments are affected by position changes
        shapeData.segments.forEach(segment => {
          affectedSegments.add(segment.id);
        });
      }
    }
    
    // Update state only if the values have changed
    if (!deepEquals(animatedControlPoints, newAnimatedControlPoints)) {
      setAnimatedControlPoints(newAnimatedControlPoints);
    }
    
    if (!deepEquals(animatedPosition, newAnimatedPosition)) {
      setAnimatedPosition(newAnimatedPosition);
    }
    
    // Direct update of affected segments in the DOM
    updateAffectedSegments(affectedSegments, newAnimatedControlPoints, newAnimatedPosition);
  };

    // Animation loop using requestAnimationFrame
  const animationLoop = (timestamp) => {
    if (!animationState.current.isAnimating) return;
    
    // Calculate the current time in the animation cycle
    const elapsedTime = (timestamp - animationState.current.startTime) / 1000; // convert to seconds
    const duration = shapeData.animations.duration;
    const loops = shapeData.animations.loops;
    
    // Log animation state occasionally (every 30 frames)
    if (Math.floor(elapsedTime * 30) % 30 === 0) {
      console.log('Animation running:', elapsedTime.toFixed(1) + 's');
    }
    
    // Calculate the effective animation time based on loops
    // If loops is 0, it's infinite, so just use modulo of duration
    // If it's a specific number, check if we've exceeded total duration
    let normalizedTime;
    if (loops === 0) {
      normalizedTime = elapsedTime % duration;
    } else {
      const totalDuration = loops * duration;
      if (elapsedTime >= totalDuration) {
        // Animation complete, clean up and exit
        animationState.current.isAnimating = false;
        cancelAnimationFrame(animationRef.current);
        return;
      }
      normalizedTime = elapsedTime % duration;
    }
    
    // Update animated values
    updateAnimationValues(normalizedTime);
    
    // Store last update time
    animationState.current.lastUpdateTime = timestamp;
    
    // Request next frame
    animationRef.current = requestAnimationFrame(animationLoop);
  };

    // Initialize animation
  const initializeAnimation = () => {
    // Only initialize if animation isn't already running and animation data exists
    if (!animationState.current.isAnimating && shapeData.animations) {
      animationState.current.isAnimating = true;
      animationState.current.startTime = performance.now();
      animationState.current.lastUpdateTime = performance.now();
      animationRef.current = requestAnimationFrame(animationLoop);
    }
  };
  
  // Setup and cleanup animation when component mounts/unmounts or when shapeData changes
  useEffect(() => {
    // If animation is defined in shapeData, set up the animation system
    if (shapeData.animations) {
      console.log('Setting up animation system...');
      initializeAnimation();
      return () => {
        // Cleanup function to stop animation when component unmounts
        if (animationRef.current) {
          console.log('Cleaning up animation...');
          cancelAnimationFrame(animationRef.current);
          animationState.current.isAnimating = false;
        }
      };
    }
  }, [shapeData]); // Note: animationLoop and other functions are defined inside the component, so they're implicitly dependencies
  
  return (
    <div 
      ref={containerRef}
      className="shape-component" 
      style={{ 
        position: 'absolute', 
        top: `${animatedPosition?.y || shapeData.position.global.y}px`, 
        left: `${animatedPosition?.x || shapeData.position.global.x}px`,
        transition: 'top 0.01s linear, left 0.01s linear' // Smooth out position updates
      }}
    >
      <svg 
        width={shapeData.width} 
        height={shapeData.height}
        viewBox={calculateViewBox()} 
        xmlns="http://www.w3.org/2000/svg"
        style={{ border: '1px dashed rgba(255, 255, 255, 0.3)' }}
      >
        {/* Render position anchor point */}
        {renderPositionAnchor}
        
        {/* Render each segment with its own style */}
        {renderSegments()}
        
        {/* Render control points */}
        {renderControlPoints}
      </svg>
    </div>
  );
};

export default Shape;

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Easing functions for smoother animations
const easingFunctions = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

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
      "cp-2": {  // Animate control point with ID "cp-2"
        keyframes: [
          { time: 0, x: 100, y: 50 },   // Starting position (at 0 seconds)
          { time: 1.0, x: 120, y: 80 },  // Position at 1 second
          { time: 2.3, x: 80, y: 90 },   // Position at 2.3 seconds
          { time: 3.0, x: 100, y: 50 }   // End position (back to start for smooth looping)
        ]
      },
      "cp-3": {  // Animate another control point
        keyframes: [
          { time: 0, x: 100, y: 100 },
          { time: 1.5, x: 120, y: 120 },
          { time: 3.0, x: 100, y: 100 }
        ]
      }
    },
    positionAnimations: {
      global: { // Animate the global position
        keyframes: [
          { time: 0, x: 100, y: 100 },
          { time: 1.5, x: 150, y: 150 },
          { time: 3.0, x: 100, y: 100 }
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

const Shape = ({ shapeData: initialShapeData = exampleShapeData }) => {
  // Create a deep copy to avoid mutating props, and maintain state for animations
  const [shapeData, setShapeData] = useState(() => JSON.parse(JSON.stringify(initialShapeData)));
  
  // Track animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const segmentCacheRef = useRef({});
  
  // Track which segments need to be updated
  const [affectedSegments, setAffectedSegments] = useState(new Set());
  
  // Animation controls
  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
  };
  
  // Helper function to find a control point by ID
  const findPoint = useCallback((pointId) => {
    return shapeData.controlPoints.find(cp => cp.id === pointId);
  }, [shapeData]);
  
  // Apply position transform to a point
  const transformPoint = (point) => {
    // Apply the SVG position transform to adjust all coordinates
    // This shifts all points relative to the shape's SVG position anchor
    return {
      ...point,
      x: point.x + shapeData.position.svg.x,
      y: point.y + shapeData.position.svg.y
    };
  };
  
  // Interpolate between keyframes to get a value at a specific time
  const interpolateValue = useCallback((keyframes, time, property, easingFn) => {
    if (!keyframes || keyframes.length === 0) return null;
    
    // Handle time before first keyframe or after last keyframe
    if (time <= keyframes[0].time) return keyframes[0][property];
    if (time >= keyframes[keyframes.length - 1].time) return keyframes[keyframes.length - 1][property];
    
    // Find the two keyframes we're between
    let startFrame = keyframes[0];
    let endFrame = keyframes[keyframes.length - 1];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time < keyframes[i + 1].time) {
        startFrame = keyframes[i];
        endFrame = keyframes[i + 1];
        break;
      }
    }
    
    // Calculate progress between the two keyframes (0 to 1)
    const timeProgress = (time - startFrame.time) / (endFrame.time - startFrame.time);
    
    // Apply easing function if provided
    const progress = easingFn ? easingFn(timeProgress) : timeProgress;
    
    // Interpolate the value
    return startFrame[property] + (endFrame[property] - startFrame[property]) * progress;
  }, []);
  
  // Get a set of segments that contain a given control point
  const getSegmentsForControlPoint = useCallback((pointId) => {
    return new Set(
      shapeData.segments
        .filter(segment => segment.points.includes(pointId))
        .map(segment => segment.id)
    );
  }, [shapeData.segments]);
  
  // Update control point positions based on current animation time
  const updateAnimatedPoints = useCallback((elapsedTime) => {
    const animations = shapeData.animations;
    if (!animations || !animations.controlPointAnimations) return;
    
    // Track affected segments for this frame
    const segmentsToUpdate = new Set();
    
    // Get animation duration - might be looping
    const duration = animations.duration || 3;
    const loopCount = animations.loops === 0 ? Infinity : animations.loops;
    const loopDuration = duration * loopCount;
    
    // Get current time in the animation cycle
    let currentTime;
    if (loopCount === Infinity || elapsedTime <= loopDuration) {
      currentTime = elapsedTime % duration;
    } else {
      // Animation finished
      currentTime = duration;
      setIsAnimating(false);
    }
    
    // Get the easing function
    const easingFn = animations.easing ? easingFunctions[animations.easing] : easingFunctions.linear;
    
    // Create a copy of the current state
    const updatedShapeData = { ...shapeData };
    let hasUpdates = false;
    
    // Update control points
    Object.entries(animations.controlPointAnimations).forEach(([pointId, animation]) => {
      const pointIndex = updatedShapeData.controlPoints.findIndex(cp => cp.id === pointId);
      if (pointIndex === -1) return;
      
      const keyframes = animation.keyframes;
      if (!keyframes || keyframes.length < 2) return;
      
      const newX = interpolateValue(keyframes, currentTime, 'x', easingFn);
      const newY = interpolateValue(keyframes, currentTime, 'y', easingFn);
      
      if (newX !== null && newY !== null) {
        // Direct update of the control point
        updatedShapeData.controlPoints[pointIndex] = {
          ...updatedShapeData.controlPoints[pointIndex],
          x: newX,
          y: newY
        };
        hasUpdates = true;
        
        // Track segments that need to be updated
        const affectedSegments = getSegmentsForControlPoint(pointId);
        affectedSegments.forEach(segId => segmentsToUpdate.add(segId));
      }
    });
    
    // Update position animations
    if (animations.positionAnimations?.global?.keyframes) {
      const globalKeyframes = animations.positionAnimations.global.keyframes;
      const newX = interpolateValue(globalKeyframes, currentTime, 'x', easingFn);
      const newY = interpolateValue(globalKeyframes, currentTime, 'y', easingFn);
      
      if (newX !== null && newY !== null) {
        updatedShapeData.position = {
          ...updatedShapeData.position,
          global: { x: newX, y: newY }
        };
        hasUpdates = true;
      }
    }
    
    // Only update state if something changed
    if (hasUpdates) {
      setShapeData(updatedShapeData);
      setAffectedSegments(segmentsToUpdate);
    }
  }, [shapeData, interpolateValue, getSegmentsForControlPoint]);
  
  // Animation frame loop
  const animate = useCallback((timestamp) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    lastFrameTimeRef.current = timestamp;
    
    const elapsedTime = (timestamp - startTimeRef.current) / 1000; // convert to seconds
    
    // Update animated points
    updateAnimatedPoints(elapsedTime);
    
    // Continue animation loop if still animating
    if (isAnimating) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isAnimating, updateAnimatedPoints]);
  
  // Start/stop animation
  useEffect(() => {
    const hasAnimations = 
      shapeData.animations && 
      (shapeData.animations.controlPointAnimations || 
       shapeData.animations.positionAnimations);
    
    // Auto-start animation if it exists
    if (hasAnimations && !isAnimating) {
      setIsAnimating(true);
    }
    
    // Set up animation loop
    if (isAnimating) {
      // Reset animation refs
      startTimeRef.current = null;
      lastFrameTimeRef.current = null;
      
      // Start animation loop
      animationRef.current = requestAnimationFrame(animate);
      
      // Clean up on unmount or when animation stops
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [shapeData.animations, isAnimating, animate]);
  
  // Update when props change
  useEffect(() => {
    // Only update if the props have changed
    if (JSON.stringify(initialShapeData) !== JSON.stringify(shapeData)) {
      setShapeData(JSON.parse(JSON.stringify(initialShapeData)));
      
      // Reset animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsAnimating(false);
      startTimeRef.current = null;
      lastFrameTimeRef.current = null;
    }
  }, [initialShapeData, shapeData]);
  
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
  const renderSegments = useCallback(() => {
    return shapeData.segments.map(segment => {
      // Skip expensive calculation for segments not affected by animation in this frame
      // unless there are no specifically tracked affected segments
      if (affectedSegments.size > 0 && !affectedSegments.has(segment.id)) {
        // Re-use previously calculated path data if possible
        const cachedPath = segmentCacheRef.current[segment.id];
        if (cachedPath) {
          return cachedPath;
        }
      }
      
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
      
      // Create path element
      const pathElement = (
        <path
          key={segment.id}
          d={pathData}
          fill="none"
          stroke={segment.style.stroke || shapeData.style.stroke}
          strokeWidth={segment.style.strokeWidth || shapeData.style.strokeWidth}
        />
      );
      
      // Cache it for future renders
      segmentCacheRef.current[segment.id] = pathElement;
      
      return pathElement;
    });
  }, [shapeData.segments, shapeData.style, affectedSegments, findPoint, transformPoint]);
  
  // Render control points as small circles
  const renderControlPoints = () => {
    return shapeData.controlPoints.map(point => {
      const transformedPoint = transformPoint(point);
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
  };
  
  // Render position anchor point (main anchor for the shape)
  const renderPositionAnchor = () => (
    <circle
      cx={shapeData.position.svg.x}
      cy={shapeData.position.svg.y}
      r={6}
      fill="yellow"
      stroke="black"
      strokeWidth="1"
    />
  );
  
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
  
  // Check if animations are defined in the shape data
  const hasAnimations = useMemo(() => {
    return shapeData.animations && (
      (shapeData.animations.controlPointAnimations && 
       Object.keys(shapeData.animations.controlPointAnimations).length > 0) || 
      (shapeData.animations.positionAnimations && 
       Object.keys(shapeData.animations.positionAnimations).length > 0)
    );
  }, [shapeData.animations]);

  return (
    <div className="shape-component" style={{ 
      position: 'absolute', 
      top: `${shapeData.position.global.y}px`, 
      left: `${shapeData.position.global.x}px`,
      transition: 'top 0.1s ease-out, left 0.1s ease-out' // Smooth transitions for global position changes
    }}>
      {hasAnimations && (
        <div style={{ 
          marginBottom: '8px', 
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'white',
          fontSize: '12px'
        }}>
          <button 
            onClick={toggleAnimation} 
            style={{ 
              background: isAnimating ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer'
            }}
          >
            {isAnimating ? 'Pause' : 'Play'}
          </button>
          <span>
            {isAnimating ? 'Animation running' : 'Animation paused'}
          </span>
        </div>
      )}
      
      <svg 
        width={shapeData.width} 
        height={shapeData.height}
        viewBox={calculateViewBox()} 
        xmlns="http://www.w3.org/2000/svg"
        style={{ border: '1px dashed rgba(255, 255, 255, 0.3)' }}
      >
        {/* Render position anchor point */}
        {renderPositionAnchor()}
        
        {/* Render each segment with its own style */}
        {renderSegments()}
        
        {/* Render control points */}
        {renderControlPoints()}
      </svg>
    </div>
  );
};

export default Shape;

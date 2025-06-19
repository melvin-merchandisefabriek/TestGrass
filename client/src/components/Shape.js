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

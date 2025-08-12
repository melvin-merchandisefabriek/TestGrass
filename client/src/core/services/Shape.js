import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  calculateControlPointPosition,
  calculateGlobalPosition,
  calculateViewBox,
  deepEquals,
  updateAffectedSegments,
  loadShapeData
} from '../../shared/utils';
import { mergeDisplayOptions } from '../../shared/utils/displayUtils';

// Default simple shape data for fallback
const defaultShapeData = {
  id: "shape-default",
  name: "Default Shape",
  width: 200,
  height: 200,
  position: {
    svg: { x: 0, y: 0 },
    global: { x: 100, y: 100 }
  },
  displayOptions: {
    showControlPoints: true,
    showAnchorPoints: true,
    showPositionAnchor: true,
    showBorder: true
  },
  controlPoints: [
    { id: "cp-1", x: 50, y: 50, type: "anchor" },
    { id: "cp-2", x: 150, y: 50, type: "anchor" },
    { id: "cp-3", x: 150, y: 150, type: "anchor" },
    { id: "cp-4", x: 50, y: 150, type: "anchor" }
  ],
  segments: [
    {
      id: "seg-1",
      type: "line",
      points: ["cp-1", "cp-2"],
      style: { stroke: "#ffffff", strokeWidth: 2 }
    },
    {
      id: "seg-2",
      type: "line",
      points: ["cp-2", "cp-3"],
      style: { stroke: "#ffffff", strokeWidth: 2 }
    },
    {
      id: "seg-3",
      type: "line",
      points: ["cp-3", "cp-4"],
      style: { stroke: "#ffffff", strokeWidth: 2 }
    },
    {
      id: "seg-4",
      type: "line",
      points: ["cp-4", "cp-1"],
      style: { stroke: "#ffffff", strokeWidth: 2 }
    }
  ],
  fillPath: true,
  closePath: true,
  style: {
    fill: "rgba(120, 200, 255, 0.3)",
    stroke: "#ffffff",
    strokeWidth: 1
  }
};

const Shape = ({ filePath, modificationsPath, shapeData: providedShapeData, shapeModifications, onClick, renderAsGroup = false }) => {
  // State for storing the loaded shape data
  const [shapeData, setShapeData] = useState(providedShapeData || defaultShapeData);
  
  // Apply in-memory modifications when they change
  useEffect(() => {
    if (shapeModifications && filePath) {
      // Dynamically import to avoid circular dependencies
      const applyModifications = async () => {
        try {
          const { applyShapeModifications } = await import('../../shared/utils/modificationUtils');
          
          // Always reload the base shape to ensure we start fresh
          const baseShape = await loadShapeData(filePath);
          
          // Apply the modifications to the freshly loaded base shape data
          const modifiedData = applyShapeModifications(baseShape, shapeModifications);
          console.log('Applied in-memory modifications:', modifiedData);
          setShapeData(modifiedData);
        } catch (error) {
          console.error('Error applying in-memory modifications:', error);
        }
      };
      
      applyModifications();
    } else if (shapeModifications && shapeData) {
      // Fall back to using current shapeData if no filePath is provided
      const applyModifications = async () => {
        try {
          const { applyShapeModifications } = await import('../../shared/utils/modificationUtils');
          
          // Apply the modifications to the current shape data
          const modifiedData = applyShapeModifications(shapeData, shapeModifications);
          console.log('Applied in-memory modifications:', modifiedData);
          setShapeData(modifiedData);
        } catch (error) {
          console.error('Error applying in-memory modifications:', error);
        }
      };
      
      applyModifications();
    }
  }, [shapeModifications, filePath]);
  
  // Load shape data from file path if provided
  useEffect(() => {
    // Skip loading from file if we're using in-memory modifications
    if (shapeModifications) {
      return;
    }
    
    if (filePath) {
      const loadData = async () => {
        try {
          // Load the base shape data
          const data = await loadShapeData(filePath);
          
          // If there's a modifications path, load and apply those modifications
          if (modificationsPath) {
            try {
              // Import dynamically to avoid circular dependencies
              const { loadModifications, applyShapeModifications } = await import('../../shared/utils/modificationUtils');
              
              // Load the modifications file
              const modifications = await loadModifications(modificationsPath);
              
              if (modifications) {
                // Apply the modifications to the shape data
                const modifiedData = applyShapeModifications(data, modifications);
                console.log('Applied modifications:', modificationsPath, modifiedData);
                setShapeData(modifiedData);
                return;
              }
            } catch (modError) {
              console.error('Error applying modifications:', modError);
              // Continue with unmodified data if modification fails
            }
          }
          
          // Set the regular shape data if no modifications or if modifications failed
          setShapeData(data);
        } catch (error) {
          console.error('Failed to load shape data:', error);
          // Fallback to default data if loading fails
          if (!providedShapeData) {
            setShapeData(defaultShapeData);
          }
        }
      };
      
      loadData();
    }
  }, [filePath, modificationsPath, providedShapeData, shapeModifications]);
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
          fill={shapeData.fillPath ? "none" : (segment.style.fill || shapeData.style.fill || "none")}
          stroke={segment.style.stroke || shapeData.style.stroke}
          strokeWidth={segment.style.strokeWidth || shapeData.style.strokeWidth}
        />
      );
    });
  };
  
  // Render control points as small circles - memoized for performance
  const renderControlPoints = useMemo(() => {
    // Use our utility to get full display options with defaults
    const displayOptions = mergeDisplayOptions(shapeData.displayOptions);
    const showControlPoints = displayOptions.showControlPoints;
    const showAnchorPoints = displayOptions.showAnchorPoints;

    // If both are hidden, return nothing
    if (!showControlPoints && !showAnchorPoints) {
      return null;
    }
    
    return shapeData.controlPoints.map(point => {
      // Skip anchor points if they should be hidden
      if (point.type === "anchor" && !showAnchorPoints) {
        return null;
      }
      
      // Skip control points if they should be hidden
      if (point.type === "control" && !showControlPoints) {
        return null;
      }
      
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
    }).filter(Boolean); // Filter out null values
  }, [shapeData.controlPoints, shapeData.displayOptions, animatedControlPoints, transformPoint]);
  
  // Render position anchor point (main anchor for the shape) - memoized for performance
  const renderPositionAnchor = useMemo(() => {
    // Use our utility to get full display options with defaults
    const displayOptions = mergeDisplayOptions(shapeData.displayOptions);
    const showPositionAnchor = displayOptions.showPositionAnchor;
    
    if (!showPositionAnchor) {
      return null;
    }
    
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
  }, [shapeData.position.svg, shapeData.displayOptions, animatedPosition]);
  
  // Render control point names - memoized for performance
  const renderControlPointNames = useMemo(() => {
    // Use our utility to get full display options with defaults
    const displayOptions = mergeDisplayOptions(shapeData.displayOptions);
    const showControlPointNames = displayOptions.showControlPointNames;
    const showControlPoints = displayOptions.showControlPoints;
    const showAnchorPoints = displayOptions.showAnchorPoints;

    // If names are not shown, or no points are shown, return nothing
    if (!showControlPointNames || (!showControlPoints && !showAnchorPoints)) {
      return null;
    }
    
    return shapeData.controlPoints.map(point => {
      // Skip anchor points if they should be hidden
      if (point.type === "anchor" && !showAnchorPoints) {
        return null;
      }
      
      // Skip control points if they should be hidden
      if (point.type === "control" && !showControlPoints) {
        return null;
      }
      
      // Use the animated values if available
      const animatedPoint = animatedControlPoints[point.id];
      const effectivePoint = animatedPoint ? 
        { ...point, ...animatedPoint } :
        point;
      
      const transformedPoint = transformPoint(effectivePoint);
      
      return (
        <text
          key={`name-${point.id}`}
          x={transformedPoint.x + 6} // Offset slightly from the point
          y={transformedPoint.y - 6}
          fontSize="10"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="0.5"
          paintOrder="stroke"
        >
          {point.id}
        </text>
      );
    }).filter(Boolean); // Filter out null values
  }, [shapeData.controlPoints, shapeData.displayOptions, animatedControlPoints, transformPoint]);

  // State for animated style properties
  const [animatedStyle, setAnimatedStyle] = useState({});
  
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
        const animatedValues = calculateControlPointPosition(
          pointId, 
          animation, 
          currentTime, 
          shapeData.animations.duration,
          shapeData.controlPoints,
          shapeData  // Pass the entire shape data to access top-level variables
        );
        if (animatedValues) {
          newAnimatedControlPoints[pointId] = animatedValues;
        }
      });
    }
    
    // Process style animations if present
    if (shapeData.animations?.styleAnimations) {
      const { calculateStyleProperties } = require('../../shared/utils/animationUtils');
      const newAnimatedStyle = calculateStyleProperties(
        shapeData.animations.styleAnimations,
        currentTime,
        shapeData.animations.duration,
        shapeData // Pass shapeData for custom variables
      );
      
      // Update animated style if changed
      if (!deepEquals(animatedStyle, newAnimatedStyle)) {
        setAnimatedStyle(newAnimatedStyle);
      }
      
      // All segments are potentially affected by style changes
      shapeData.segments.forEach(segment => {
        affectedSegments.add(segment.id);
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
    updateAffectedSegments(
      affectedSegments, 
      shapeData, 
      newAnimatedControlPoints, 
      newAnimatedPosition, 
      segmentRefs.current, 
      containerRef.current
    );
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
  
  if (renderAsGroup) {
    // Render as SVG group for unified SVG
    // Only apply svg position as a transform if explicitly provided in shapeModifications
    let svgPos = { x: 0, y: 0 };
    if (shapeModifications && shapeModifications.modifyPosition && shapeModifications.modifyPosition.svg) {
      svgPos = shapeModifications.modifyPosition.svg;
    }
    return (
      <g
        ref={containerRef}
        className="shape-component"
        transform={`translate(${svgPos.x},${svgPos.y})`}
        onClick={onClick}
      >
        {/* If fillPath is true, render a single combined path with fill */}
        {shapeData.fillPath && (
          <path
            className="shape-fill-path"
            d={(() => {
              let pathData = '';
              let firstPoint = null;
              shapeData.segments.forEach((segment, index) => {
                const points = segment.points.map(pointId => {
                  const point = findPoint(pointId);
                  return transformPoint(point);
                });
                if (index === 0) {
                  if (segment.type === 'line') {
                    const start = points[0];
                    const end = points[1];
                    pathData += `M ${start.x} ${start.y} L ${end.x} ${end.y} `;
                    firstPoint = start;
                  } else if (segment.type === 'bezier') {
                    const start = points[0];
                    const control1 = points[1];
                    const control2 = points[2];
                    const end = points[3];
                    pathData += `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
                    firstPoint = start;
                  }
                } else {
                  if (segment.type === 'line') {
                    const end = points[1];
                    pathData += `L ${end.x} ${end.y} `;
                  } else if (segment.type === 'bezier') {
                    const control1 = points[1];
                    const control2 = points[2];
                    const end = points[3];
                    pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
                  }
                }
              });
              if (shapeData.closePath) {
                pathData += 'Z';
              }
              return pathData;
            })()}
            fill={animatedStyle.fill || shapeData.style.fill || "none"}
            stroke={animatedStyle.stroke || shapeData.style.stroke}
            strokeWidth={animatedStyle.strokeWidth || shapeData.style.strokeWidth}
          />
        )}
        {renderPositionAnchor}
        {renderSegments()}
        {renderControlPoints}
        {renderControlPointNames}
      </g>
    );
  }

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
        viewBox={calculateViewBox(shapeData.position.svg, shapeData.width, shapeData.height, shapeData)} 
        xmlns="http://www.w3.org/2000/svg"
        style={{ border: mergeDisplayOptions(shapeData.displayOptions).showBorder ? '1px dashed rgba(255, 255, 255, 0.3)' : 'none' }}
        onClick={onClick}
      >
        {/* If fillPath is true, render a single combined path with fill */}
        {shapeData.fillPath && (
          <path
            className="shape-fill-path"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            d={(() => {
              let pathData = '';
              let firstPoint = null;
              
              // Always use the actual segment definitions for all shapes to preserve exact appearance
              // Process each segment to preserve bezier curves and lines correctly
              shapeData.segments.forEach((segment, index) => {
                const points = segment.points.map(pointId => {
                  const point = findPoint(pointId);
                  return transformPoint(point);
                });
                
                if (index === 0) {
                  // First segment - start with a move command
                  if (segment.type === 'line') {
                    const start = points[0];
                    const end = points[1];
                    pathData += `M ${start.x} ${start.y} L ${end.x} ${end.y} `;
                    firstPoint = start;
                  } else if (segment.type === 'bezier') {
                    const start = points[0];
                    const control1 = points[1];
                    const control2 = points[2];
                    const end = points[3];
                    pathData += `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
                    firstPoint = start;
                  }
                } else {
                  // Subsequent segments - continue the path
                  if (segment.type === 'line') {
                    const end = points[1];
                    pathData += `L ${end.x} ${end.y} `;
                  } else if (segment.type === 'bezier') {
                    const control1 = points[1];
                    const control2 = points[2];
                    const end = points[3];
                    pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
                  }
                }
              });
              
              // Add the Z command to close the path if requested
              if (shapeData.closePath) {
                pathData += 'Z';
              }
              
              // Log path data for debugging specific shapes
              if (shapeData.id === 'menu-square' || shapeData.id === 'triangle-shape') {
                console.log(`Generated bezier-preserving path for ${shapeData.id}: ${pathData}`);
              }
              
              return pathData;
            })()}
            fill={animatedStyle.fill || shapeData.style.fill || "none"}
            stroke={animatedStyle.stroke || shapeData.style.stroke}
            strokeWidth={animatedStyle.strokeWidth || shapeData.style.strokeWidth}
          />
        )}
        
        {/* Render position anchor point */}
        {renderPositionAnchor}
        
        {/* Render each segment with its own style */}
        {renderSegments()}
        
        {/* Render control points */}
        {renderControlPoints}
        
        {/* Render control point names */}
        {renderControlPointNames}
      </svg>
    </div>
  );
};

export default Shape;

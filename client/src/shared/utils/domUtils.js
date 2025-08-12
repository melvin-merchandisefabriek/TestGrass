/**
 * DOM manipulation utilities for Shape component
 */

/**
 * Deep equals helper for comparing objects
 * @param {Object} obj1 - First object to compare
 * @param {Object} obj2 - Second object to compare
 * @returns {boolean} Whether the objects are deeply equal
 */
export const deepEquals = (obj1, obj2) => {
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

/**
 * Updates all SVG path elements affected by animation
 * @param {Set} affectedSegments - Set of segment IDs that need updating
 * @param {Object} shapeData - Shape configuration data
 * @param {Object} controlPoints - Current animated control point positions
 * @param {Object} position - Current animated position
 * @param {Object} segmentRefs - References to segment DOM elements
 * @param {Object} containerRef - Reference to container DOM element
 */
export const updateAffectedSegments = (
  affectedSegments, 
  shapeData, 
  controlPoints, 
  position, 
  segmentRefs, 
  containerRef
) => {
  // Track if we need to update the fill path
  let updateFillPath = false;
  
  // For each affected segment, directly update its path data
  affectedSegments.forEach(segmentId => {
    updateFillPath = true; // Any segment change requires fill path update
    
    const pathElement = segmentRefs[segmentId];
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
  
  // Update the fill path if needed
  if (updateFillPath && shapeData.fillPath) {
    const fillPathElement = containerRef?.querySelector('.shape-fill-path');
    if (fillPathElement) {
      // Generate the path data using the updated control points
      let pathData = '';
      let firstPoint = null;
      
      // Build the path directly using the segments in order
      // This is better than collecting points and then creating a path
      let firstSegmentAdded = false;
      
      // Process each segment in order
      shapeData.segments.forEach((segment) => {
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
        
        // Add path commands based on segment type
        if (segment.type === 'line') {
          const start = points[0];
          const end = points[1];
          
          if (!firstSegmentAdded) {
            // First segment starts with a Move command
            pathData += `M ${start.x} ${start.y} L ${end.x} ${end.y} `;
            firstPoint = start;
            firstSegmentAdded = true;
          } else {
            // Subsequent segments continue from previous point
            pathData += `L ${end.x} ${end.y} `;
          }
        } else if (segment.type === 'bezier') {
          const start = points[0];
          const control1 = points[1];
          const control2 = points[2];
          const end = points[3];
          
          if (!firstSegmentAdded) {
            // First segment starts with a Move command
            pathData += `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
            firstPoint = start;
            firstSegmentAdded = true;
          } else {
            // Subsequent segments continue from previous point with just the curve part
            pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
          }
        }
      });
      
      // If shape is marked as closed, add Z command to close the path
      if (shapeData.closePath) {
        pathData += 'Z';
      }
      
      // Update the fill path with the new path data
      fillPathElement.setAttribute('d', pathData);
    } else {
      console.warn('Fill path element not found. Make sure it has class "shape-fill-path"');
    }
  }
};

/**
 * Calculates the SVG viewBox for the shape
 * @param {Object} svgPosition - Position within the SVG coordinate system
 * @param {number} width - Width of the shape
 * @param {number} height - Height of the shape
 * @param {Object} [shapeData] - Complete shape data including animations (optional)
 * @returns {string} SVG viewBox attribute value
 */
export const calculateViewBox = (svgPosition, width, height, shapeData) => {
  // Default padding (small margin around the shape)
  const DEFAULT_PADDING = 10;
  
  // If shapeData has an explicit viewBox property, use that directly
  if (shapeData && shapeData.viewBox) {
    // When viewBox is explicit, the SVG position should be treated as an offset from the origin
    // of the viewBox coordinate system. The yellow dot should be positioned at svgPosition
    // within the viewBox coordinate system.
    return shapeData.viewBox;
  }
  
  // If no shape data is provided, use default dimensions with small padding
  if (!shapeData) {
    return `${-svgPosition.x - DEFAULT_PADDING} ${-svgPosition.y - DEFAULT_PADDING} ${width + DEFAULT_PADDING * 2} ${height + DEFAULT_PADDING * 2}`;
  }
  
  // Otherwise, use a simple viewBox based on dimensions with padding
  // Position the viewBox so that the position.svg coordinates are in the top-left
  const padding = DEFAULT_PADDING;
  const viewBoxX = -svgPosition.x - padding;
  const viewBoxY = -svgPosition.y - padding;
  const viewBoxWidth = width + (padding * 2);
  const viewBoxHeight = height + (padding * 2);
  
  return `${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`;
};

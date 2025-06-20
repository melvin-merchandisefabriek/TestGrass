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
      
      shapeData.segments.forEach(segment => {
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
        
        if (segment.type === 'line') {
          const start = points[0];
          const end = points[1];
          
          if (pathData === '') {
            pathData += `M ${start.x} ${start.y} `;
          } else {
            pathData += `L ${end.x} ${end.y} `;
          }
        } else if (segment.type === 'bezier') {
          const start = points[0];
          const control1 = points[1];
          const control2 = points[2];
          const end = points[3];
          
          if (pathData === '') {
            pathData += `M ${start.x} ${start.y} `;
          }
          pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
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
 * @returns {string} SVG viewBox attribute value
 */
export const calculateViewBox = (svgPosition, width, height) => {
  // Calculate padding based on the shape's dimensions
  const padding = Math.max(width, height) * 0.1;
  
  // Define the viewBox area
  return `${svgPosition.x - padding} ${svgPosition.y - padding} ${width + padding * 2} ${height + padding * 2}`;
};

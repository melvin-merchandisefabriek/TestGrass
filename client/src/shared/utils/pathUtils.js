/**
 * SVG path generation utility functions for Shape component
 */

/**
 * Generates SVG path data for a line segment
 * @param {Object} start - Start point coordinates {x, y}
 * @param {Object} end - End point coordinates {x, y}
 * @param {boolean} isFirstSegment - Whether this is the first segment in the path
 * @returns {string} SVG path data string
 */
export const generateLinePathData = (start, end, isFirstSegment = true) => {
  if (isFirstSegment) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }
  return `L ${end.x} ${end.y}`;
};

/**
 * Generates SVG path data for a cubic bezier curve segment
 * @param {Object} start - Start point coordinates {x, y}
 * @param {Object} control1 - First control point coordinates {x, y}
 * @param {Object} control2 - Second control point coordinates {x, y}
 * @param {Object} end - End point coordinates {x, y}
 * @param {boolean} isFirstSegment - Whether this is the first segment in the path
 * @returns {string} SVG path data string
 */
export const generateBezierPathData = (start, control1, control2, end, isFirstSegment = true) => {
  if (isFirstSegment) {
    return `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
  }
  return `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
};

/**
 * Generates a complete SVG path from multiple segments
 * @param {Array} segments - Array of segment definitions
 * @param {Function} findPoint - Function to find a point by ID
 * @param {Function} transformPoint - Function to transform a point
 * @param {boolean} closePath - Whether to close the path
 * @returns {string} SVG path data string
 */
export const generateCombinedPathData = (segments, findPoint, transformPoint, closePath) => {
  let pathData = '';
  
  segments.forEach((segment, index) => {
    const points = segment.points.map(pointId => transformPoint(findPoint(pointId)));
    const isFirstSegment = index === 0;
    
    if (segment.type === 'line') {
      const start = points[0];
      const end = points[1];
      
      if (isFirstSegment) {
        pathData += `M ${start.x} ${start.y} `;
      }
      pathData += `L ${end.x} ${end.y} `;
    } else if (segment.type === 'bezier') {
      const start = points[0];
      const control1 = points[1];
      const control2 = points[2];
      const end = points[3];
      
      if (isFirstSegment) {
        pathData += `M ${start.x} ${start.y} `;
      }
      pathData += `C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y} `;
    }
  });
  
  // If shape is marked as closed, add Z command to close the path
  if (closePath) {
    pathData += 'Z';
  }
  
  return pathData;
};
